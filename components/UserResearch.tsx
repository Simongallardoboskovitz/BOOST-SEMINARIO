import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface UserResearchProps {
    onAccept: (data: { persona: string; needs: string; behaviors: string; pains: string; qualitativeGuide: string; quantitativeGuide: string; }) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

// Component to manage a single interview guide (Qualitative or Quantitative)
const InterviewGuideGenerator = ({ type, persona, onAccept, setIsAiTyping }: {
    type: 'qualitative' | 'quantitative';
    persona: string;
    onAccept: (guide: string) => void;
    setIsAiTyping: (isTyping: boolean) => void;
}) => {
    const [guide, setGuide] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedGuide, setEditedGuide] = useState('');
    const [error, setError] = useState('');

    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const generateGuide = async (isRobustify = false) => {
        setIsLoading(true);
        setIsAiTyping(true);
        setError('');
        
        const basePrompt = `Actúa como un investigador de UX senior. Basado en el siguiente User Persona, crea una pauta de entrevista.
**User Persona:**
${stripHtml(persona)}

**Formato:** Usa HTML (<p>, <ul>, <li>, <strong>) para una presentación clara y organizada.`;

        const qualitativeTask = `**Tarea:** Genera una pauta de entrevista CUALITATIVA semiestructurada. Incluye un objetivo claro, 5-7 preguntas abiertas y de sondeo, y consejos para la escucha activa.`;
        const quantitativeTask = `**Tarea:** Genera una propuesta de encuesta CUANTITATIVA. Incluye un objetivo claro, 5-7 preguntas cerradas (opción múltiple, escala Likert) y los indicadores que se podrían obtener.`;
        const robustifyTask = `**Tarea (Robustecer):** Toma la siguiente guía de entrevista y robustécela. Mejora la claridad y el enfoque de las preguntas y añade una pregunta de sondeo relevante. Guía original: ${guide}`;

        let prompt;
        if (isRobustify) {
            prompt = `${basePrompt}\n\n${robustifyTask}`;
        } else {
            prompt = `${basePrompt}\n\n${type === 'qualitative' ? qualitativeTask : quantitativeTask}`;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setGuide(response.text);
        } catch (err: any) {
            console.error(err);
            setError('Error al generar la guía. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
            setIsAiTyping(false);
        }
    };
    
    return (
        <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in mt-6">
             <button onClick={() => generateGuide(false)} disabled={isLoading || !!guide} className="w-full py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                {isLoading ? 'Generando...' : `Generar Entrevista ${type === 'qualitative' ? 'Cualitativa' : 'Cuantitativa'}`}
            </button>
            {isLoading && !guide && (
                 <div className="mt-4 text-center">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
                </div>
            )}
            {guide && (
                <div className="mt-4 pt-4 border-t">
                     {isEditing ? (
                        <div>
                            <textarea value={editedGuide} onChange={(e) => setEditedGuide(e.target.value)} className="w-full h-48 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black" />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-300 font-semibold">Cancelar</button>
                                <button onClick={() => { setGuide(editedGuide); setIsEditing(false); }} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button>
                            </div>
                        </div>
                    ) : (
                         <>
                            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: guide }} />
                            <div className="flex flex-col sm:flex-row gap-2 mt-4 border-t pt-4">
                                <button onClick={() => { setEditedGuide(guide); setIsEditing(true); }} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">✍️ Editar</button>
                                <button onClick={() => generateGuide(true)} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">🔁 Robustecer</button>
                                <button onClick={() => onAccept(guide)} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">✅ Aceptar</button>
                            </div>
                        </>
                    )}
                </div>
            )}
            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};


const UserResearch: React.FC<UserResearchProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [view, setView] = useState<'summary_loading' | 'summary_displayed' | 'persona_loading' | 'persona_displayed' | 'persona_accepted' | 'finalized'>('summary_loading');
    const [summaryText, setSummaryText] = useState('');
    const [narrativePersona, setNarrativePersona] = useState('');
    const [qualitativeGuide, setQualitativeGuide] = useState<string | null>(null);
    const [quantitativeGuide, setQuantitativeGuide] = useState<string | null>(null);
    const [error, setError] = useState('');
    
    const [needs, setNeeds] = useState('');
    const [behaviors, setBehaviors] = useState('');
    const [pains, setPains] = useState('');

    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');

    useEffect(() => {
        if (qualitativeGuide !== null && quantitativeGuide !== null) {
            onAccept({ persona: narrativePersona, needs, behaviors, pains, qualitativeGuide, quantitativeGuide });
            setView('finalized');
        }
    }, [qualitativeGuide, quantitativeGuide]);

    const stripHtml = (html: string) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    useEffect(() => {
        const generateSummary = async () => {
            setIsAiTyping(true);
            setError('');
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Actúa como un sintetizador de información experto. Revisa todo el trabajo que un estudiante ha realizado hasta ahora y genera un resumen compacto en prosa fluida. Este texto servirá como base para el siguiente paso.

**Datos del Proyecto:**
*   Tema (Paso 2): ${allData.topic}
*   Exploración Temática (Paso 2, IA): ${stripHtml(allData.themeExplorationAiResponse)}
*   Reflexión sobre Diseño (Paso 3): ${stripHtml(allData.disciplinaryScopeAiResponse)}
*   Contribución Personal (Paso 4): ${stripHtml(allData.personalContributionAiResponse)}
*   Oportunidad de Diseño (Paso 5): ${allData.projectGapAnalysis}

**Tarea:** Redacta un texto consolidado que entrelace coherentemente los puntos clave de los datos proporcionados. Usa **títulos en negrita** (ej. **Tema**) para separar cada sección. El texto debe ser editable por el usuario. No uses HTML, solo texto plano con markdown para negrita.`;
                
                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                let formattedText = response.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                setSummaryText(formattedText);
                setView('summary_displayed');
            } catch (err: any) {
                console.error(err);
                setError('Error al generar el resumen del proyecto. Intenta recargar.');
            } finally {
                setIsAiTyping(false);
            }
        };
        generateSummary();
    }, []);

    const handleGeneratePersona = async (isIteration = false) => {
        setIsAiTyping(true);
        setView('persona_loading');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un estratega de diseño y escritor creativo. Basado en el resumen del proyecto de un estudiante y sus reflexiones sobre el usuario, crea un "User Persona" en formato de prosa narrativa. El objetivo es darle vida a un arquetipo de usuario para que el estudiante pueda identificar a quién entrevistar.
${isIteration ? 'TAREA DE ITERACIÓN: Ofrece una versión alternativa del User Persona, quizás con un matiz diferente en sus motivaciones o frustraciones.' : ''}

**Resumen del Proyecto:**
"${stripHtml(summaryText)}"
**Reflexiones del Usuario:**
*   Necesidades: "${needs}"
*   Comportamientos: "${behaviors}"
*   Frustraciones (Pains): "${pains}"


**Tarea:**
Escribe una descripción detallada de un user persona potencial. Integra TODA la información anterior. Incluye:
*   Un nombre y un arquetipo (ej: "Sofía, la activista comunitaria desconectada").
*   Una descripción de quién es, su contexto y su rutina.
*   Cómo vive el problema o la necesidad que el proyecto busca abordar.
*   Qué siente al respecto (frustraciones, deseos, esperanzas).
*   Qué necesita específicamente.
*   Por qué podría beneficiarse directamente de una solución como la que el proyecto insinúa.

**Formato:** Usa HTML simple (<p>, <strong>, <em>) para que el texto sea legible y atractivo.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setNarrativePersona(response.text);
            setView('persona_displayed');
        } catch (err: any) {
            console.error(err);
            setError('Error al generar el User Persona. Inténtalo de nuevo.');
            setView('summary_displayed');
        } finally {
            setIsAiTyping(false);
        }
    };
    
    const handleEdit = (targetText: string) => {
        setIsEditing(true);
        setEditedText(targetText);
    };

    const handleSaveSummaryEdit = () => {
        setSummaryText(editedText);
        setIsEditing(false);
    };
     const handleSavePersonaEdit = () => {
        setNarrativePersona(editedText);
        setIsEditing(false);
    };
    
    const isLoading = view.endsWith('_loading');

    const renderLoading = (text: string) => (
        <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-black mt-2">{text}</p>
        </div>
    );
    
    return (
        <div className="w-full mt-8 space-y-6">
            {view === 'summary_loading' && renderLoading('Generando resumen de tu proyecto...')}
            
            {(view === 'summary_displayed' || view.startsWith('persona')) && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <h3 className="font-bold text-lg mb-2">Resumen del Proyecto</h3>
                     {isEditing && view === 'summary_displayed' ? (
                         <div>
                            <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full h-40 p-3 bg-gray-50 border border-gray-200 rounded-lg" />
                             <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold">Cancelar</button>
                                <button onClick={handleSaveSummaryEdit} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button>
                            </div>
                        </div>
                    ) : (
                         <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: summaryText }} />
                    )}
                    
                    <div className="mt-4 border-t pt-4 space-y-4">
                        <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700">Necesidades del usuario</label>
                            <input type="text" value={needs} onChange={e => setNeeds(e.target.value)} placeholder="Ej: Necesita sentirse conectado con su comunidad local" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
                        </div>
                         <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700">Comportamientos</label>
                            <input type="text" value={behaviors} onChange={e => setBehaviors(e.target.value)} placeholder="Ej: Usa redes sociales para eventos, pero le cuesta encontrar cosas nuevas" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
                        </div>
                         <div>
                            <label className="block mb-1 text-sm font-bold text-gray-700">Frustraciones (Pains)</label>
                            <input type="text" value={pains} onChange={e => setPains(e.target.value)} placeholder="Ej: Siente que los eventos importantes no tienen suficiente difusión" className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"/>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4 border-t pt-4">
                        <button onClick={() => handleEdit(summaryText)} disabled={isLoading || narrativePersona !== '' || isEditing} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">✍️ Editar Resumen</button>
                        <button onClick={() => handleGeneratePersona(false)} disabled={isLoading || narrativePersona !== '' || isEditing || !needs || !behaviors || !pains} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                            {view === 'persona_loading' ? 'Generando...' : 'Crear User Persona'}
                        </button>
                    </div>
                </div>
            )}
            
            {view === 'persona_loading' && renderLoading('Creando User Persona...')}

            {(view === 'persona_displayed' || view === 'persona_accepted') && (
                 <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-lg mb-4">User Persona Potencial</h3>
                    {isEditing && view === 'persona_displayed' ? (
                        <div>
                            <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full h-48 p-3 bg-gray-50 border border-gray-200 rounded-lg" />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold">Cancelar</button>
                                <button onClick={handleSavePersonaEdit} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: narrativePersona }} />
                    )}

                    {view === 'persona_displayed' && !isEditing && (
                         <div className="flex flex-col sm:flex-row gap-2 mt-4 border-t pt-4">
                            <button onClick={() => handleGeneratePersona(true)} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">🔁 Iterar</button>
                            <button onClick={() => handleEdit(narrativePersona)} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">✍️ Editar</button>
                            <button onClick={() => setView('persona_accepted')} disabled={isLoading} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">✅ Aceptar Versión</button>
                        </div>
                    )}
                     
                     {view === 'persona_accepted' && (
                         <div className="mt-6 border-t pt-6">
                            <h3 className="font-bold text-lg mb-2 text-center">Generar Pautas de Entrevista</h3>
                            {qualitativeGuide === null ? (
                                <InterviewGuideGenerator type="qualitative" persona={narrativePersona} onAccept={setQualitativeGuide} setIsAiTyping={setIsAiTyping} />
                            ) : (
                                 <div className="bg-gray-100 border-l-4 border-black text-black p-4 mt-6 rounded">
                                    <h4 className="font-bold">Guía Cualitativa Aceptada</h4>
                                </div>
                            )}
                             {quantitativeGuide === null ? (
                                <InterviewGuideGenerator type="quantitative" persona={narrativePersona} onAccept={setQuantitativeGuide} setIsAiTyping={setIsAiTyping} />
                            ) : (
                                <div className="bg-gray-100 border-l-4 border-black text-black p-4 mt-6 rounded">
                                    <h4 className="font-bold">Guía Cuantitativa Aceptada</h4>
                                </div>
                            )}
                         </div>
                     )}
                 </div>
            )}
            
            {view === 'finalized' && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in border-2 border-black">
                    <h3 className="font-bold text-lg mb-2 text-black">✓ Investigación de Usuario Completa</h3>
                    <p>Has aceptado el User Persona y ambas guías de entrevista. Puedes continuar al siguiente paso.</p>
                </div>
            )}

            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};

export default UserResearch;