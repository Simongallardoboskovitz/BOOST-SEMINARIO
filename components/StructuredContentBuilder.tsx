import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface Field {
    key: string;
    label: string;
    placeholder: string;
}

interface StructuredContentBuilderProps {
    step: number;
    title: string;
    pedagogicalText: string;
    structureFields?: Field[];
    compositionTemplate?: (data: Record<string, string>) => string;
    onAccept: (data: any) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
    // Props for Step 10 specifically
    objectives?: string[];
    onObjectivesChange?: (objectives: string[]) => void;
}

const StructuredContentBuilder: React.FC<StructuredContentBuilderProps> = ({
    step,
    title,
    pedagogicalText,
    structureFields = [],
    compositionTemplate = () => '',
    onAccept,
    profile,
    allData,
    setIsAiTyping,
    objectives,
    onObjectivesChange,
}) => {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [composedText, setComposedText] = useState('');
    const [improvedText, setImprovedText] = useState('');
    const [robustOptions, setRobustOptions] = useState<string[]>([]);
    const [selectedRobustOption, setSelectedRobustOption] = useState<string | null>(null);
    const [finalText, setFinalText] = useState('');
    
    const [isLoading, setIsLoading] = useState(''); // 'improve', 'robustify', ''
    const [isAnimating, setIsAnimating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState<'initial' | 'composed' | 'robust_options' | 'accepted'>('initial');
    const [animatingIndex, setAnimatingIndex] = useState(0);

    // For step 10
    const [correctedObjectives, setCorrectedObjectives] = useState<string[]>([]);
    const [refineOptions, setRefineOptions] = useState<string[]>([]);
    const [selectedRefineOption, setSelectedRefineOption] = useState<string | null>(null);


    useEffect(() => {
        if (step !== 10) {
            const initialData = structureFields.reduce((acc, field) => ({ ...acc, [field.key]: '' }), {});
            setFormData(initialData);
        }
    }, [step, structureFields]);
     
    useEffect(() => {
        if (view === 'robust_options' || view === 'initial') {
            setAnimatingIndex(0);
        }
    },[view, robustOptions]);

    useEffect(() => {
        if (step !== 10) {
            if (view === 'initial' || view === 'composed') {
                const newComposedText = compositionTemplate(formData);
                setComposedText(newComposedText);
            }
        }
    }, [formData, compositionTemplate, view, step]);

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };
    
    const handleObjectiveChange = (index: number, value: string) => {
        if (onObjectivesChange && objectives) {
            const newObjectives = [...objectives];
            newObjectives[index] = value;
            onObjectivesChange(newObjectives);
        }
    };
    
    const getCurrentText = () => {
        if (step === 10) {
            return objectives?.map((o, i) => `${i + 1}. ${o}`).join('\n') || '';
        }
        return improvedText || composedText;
    };

    const handleImprove = async () => {
        setIsLoading('improve');
        setIsAiTyping(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un excelente editor académico. Toma el siguiente texto y mejóralo, corrigiendo la sintaxis y el estilo para que sea más claro, conciso y académico, pero sin alterar el significado central.

Texto original: "${composedText}"

Versión mejorada:`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setImprovedText(response.text);
            setView('composed');
        } catch (err: any) {
             if (err.toString().includes('429')) setError('Límite de solicitudes alcanzado. Por favor, espera un momento.');
             else setError('Error al mejorar el texto.');
            console.error(err);
        } finally {
            setIsLoading('');
            setIsAiTyping(false);
        }
    };
    
    const handleRobustify = async () => {
        setIsLoading('robustify');
        setIsAiTyping(true);
        setError('');
        setRobustOptions([]);
        setSelectedRobustOption(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un mentor de investigación creativo para un estudiante llamado ${profile?.nombre || 'estudiante'}.
El estudiante ha redactado la siguiente idea para su proyecto sobre "${allData.topic}":
Idea: "${getCurrentText()}"

Tarea: Genera exactamente TRES versiones alternativas y robustecidas de esta idea. Cada versión debe tener un enfoque distinto y no debe superar las 140 palabras.
Separa las tres opciones con el delimitador exacto: <!-- OPTION -->
No agregues numeración ni títulos.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const options = response.text.split('<!-- OPTION -->').map(o => o.trim()).filter(Boolean);
            setRobustOptions(options);
            setView('robust_options');
        } catch (err: any) {
            if (err.toString().includes('429')) setError('Límite de solicitudes alcanzado. Por favor, espera un momento.');
            else setError('Error al generar opciones.');
            console.error(err);
        } finally {
            setIsLoading('');
            setIsAiTyping(false);
        }
    };
    
    const handleSelectRobustOption = (option: string) => {
        setFinalText(option);
        setSelectedRobustOption(option);
        setIsAnimating(true);
    };

    const handleEditClick = () => {
        setFinalText(composedText);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        setComposedText(finalText);
        setImprovedText(''); // Clear improved text as base has changed
        setIsEditing(false);
    };

    const handleAccept = () => {
        const textToAccept = finalText || improvedText || composedText;
        const dataToAccept = step === 10 ? (finalText ? finalText.split('\n') : objectives) : textToAccept;
        onAccept(dataToAccept);
        setFinalText(textToAccept);
        setView('accepted');
    };
    
    const handleAcceptAndClosePopup = () => {
        const objectivesArray = finalText
            .split('\n')
            .map(o => o.replace(/^\d+\.\s*/, '').trim())
            .filter(Boolean);
        onAccept(objectivesArray);
        setView('accepted');
        setSelectedRobustOption(null);
    };

    const getAcceptButtonText = () => {
        if (title.toLowerCase().includes('hipótesis')) {
            return 'Aceptar hipótesis';
        }
        if (title.toLowerCase().includes('pregunta')) {
            return 'Aceptar pregunta';
        }
        if (title.toLowerCase().includes('objetivo')) {
            return 'Aceptar objetivo';
        }
        return 'Aceptar';
    };

    // --- Step 10 Specific Logic ---
    const handleCorrectSyntax = async () => {
        setIsLoading('improve');
        setIsAiTyping(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un editor académico. Toma los siguientes objetivos específicos y mejora su sintaxis para que sean claros y académicos, manteniendo su significado. Devuelve solo los 3 objetivos, cada uno en una nueva línea.
Objetivos originales:
${objectives?.join('\n')}
`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const corrected = response.text.split('\n').map(o => o.replace(/^\d+\.\s*/, '').trim()).filter(Boolean);
            setCorrectedObjectives(corrected);
        } catch (e) {
            setError('Error al corregir la sintaxis');
            console.error(e);
        } finally {
            setIsLoading('');
            setIsAiTyping(false);
        }
    };

    const handleRefineWithAI = async () => {
        setIsLoading('robustify');
        setIsAiTyping(true);
        setError('');
        const baseObjectives = correctedObjectives.length > 0 ? correctedObjectives : objectives;
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un mentor de investigación. El estudiante tiene estos objetivos: "${baseObjectives?.join(', ')}". Su objetivo general es "${allData.generalObjective}" y su pregunta es "${allData.researchQuestion}".
TAREA: Genera 3 conjuntos de objetivos específicos alternativos.
Opción 1: Ajusta los objetivos para alinearlos mejor con el objetivo general y la pregunta.
Opción 2: Una versión iterada y más ambiciosa, alineada a todo el contexto previo del proyecto.
Opción 3: Una versión más enfocada en la viabilidad y el impacto a corto plazo.

Formato: Para cada opción, lista los 3 objetivos. Separa cada CONJUNTO de tres objetivos con el delimitador "<!-- OPTION -->".
Ejemplo:
1. Objetivo A \n 2. Objetivo B \n 3. Objetivo C<!-- OPTION -->1. Objetivo X \n 2. Objetivo Y \n 3. Objetivo Z...`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const options = response.text.split('<!-- OPTION -->').map(o => o.trim()).filter(Boolean);
            const finalOptions = [baseObjectives?.join('\n') || '', ...options];
            setRefineOptions(finalOptions);
            setSelectedRobustOption(null);
        } catch (e) {
            setError('Error al refinar los objetivos');
            console.error(e);
        } finally {
            setIsLoading('');
            setIsAiTyping(false);
        }
    };
    
    if (step === 10 && objectives && onObjectivesChange) {
         const objectiveFields = [
            { key: 'specific1', label: 'Fundamentos del Conocimiento (Investigar y Comprender)', placeholder: 'Ej: Investigar las necesidades tecnológicas de los artesanos' },
            { key: 'specific2', label: 'Aplicación y Conexión (Experimentar y Analizar)', placeholder: 'Ej: Co-diseñar los flujos de interacción de la plataforma con usuarios piloto' },
            { key: 'specific3', label: 'Pensamiento Crítico y Creación (Evaluar y Crear)', placeholder: 'Ej: Desarrollar y testear un prototipo funcional de la herramienta' }
         ];
        const canProceed = Array.isArray(objectives) && objectives.every(o => o.trim() !== '');
        
        return (
             <div className="w-full mt-8 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <p className="text-black italic mb-4">{pedagogicalText}</p>
                    <div className="space-y-4">
                        {objectiveFields.map((field, index) => (
                             <div key={field.key}>
                                <label className="block mb-1 text-sm font-bold text-black">{field.label}</label>
                                <input
                                    type="text"
                                    value={objectives[index]}
                                    onChange={(e) => handleObjectiveChange(index, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {canProceed && (
                    <div className="bg-white p-6 rounded-xl shadow-lg text-center space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button onClick={handleCorrectSyntax} disabled={!!isLoading} className="flex-1 py-3 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                                {isLoading === 'improve' ? 'Corrigiendo...' : 'Corregir sintaxis'}
                            </button>
                             <button onClick={handleRefineWithAI} disabled={!!isLoading} className="flex-1 py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                                {isLoading === 'robustify' ? 'Refinando...' : 'Refinar con IA'}
                            </button>
                        </div>
                    </div>
                )}
                
                {correctedObjectives.length > 0 && !refineOptions.length && (
                     <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                        <h3 className="font-bold text-lg mb-2 text-black">✓ Sintaxis Corregida:</h3>
                        <ul className="list-disc pl-5">
                            {correctedObjectives.map((o, i) => <li key={i} className="p-1 text-black">{o}</li>)}
                        </ul>
                    </div>
                )}

                {refineOptions.length > 0 && (
                     <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                        <h3 className="font-bold text-lg mb-4">Elige una versión de tus objetivos:</h3>
                         <div className="space-y-3">
                             {refineOptions.map((option, index) => (
                                 <button key={index} onClick={() => handleSelectRobustOption(option)}
                                     className={`w-full text-left p-4 border-2 rounded-lg transition ${selectedRobustOption === option ? 'border-black bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}>
                                     {index === 0 ? <strong>Mantener propuesta corregida</strong> : `Opción ${index}`}
                                     <p className="whitespace-pre-wrap text-black">{option}</p>
                                 </button>
                             ))}
                         </div>
                    </div>
                )}

                 {selectedRobustOption && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRobustOption(null)}>
                        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-left animate-fade-in" onClick={e => e.stopPropagation()}>
                            <h3 className="text-xl font-bold mb-4">Propuesta Seleccionada</h3>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                {isEditing ? (
                                    <textarea value={finalText} onChange={(e) => setFinalText(e.target.value)} className="w-full h-32 p-3 bg-white border border-gray-300 rounded-lg" />
                                ): (
                                    <p className="whitespace-pre-wrap text-black">{finalText}</p>
                                )}
                            </div>
                             <div className="flex gap-4 mt-4">
                                <button onClick={() => setIsEditing(true)} disabled={isEditing} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300">Editar</button>
                                <button onClick={handleRefineWithAI} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300">Iterar</button>
                                <button onClick={handleAcceptAndClosePopup} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800">Aceptar propuesta</button>
                            </div>
                        </div>
                    </div>
                )}

                 {view === 'accepted' && (
                    <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in border-2 border-black">
                        <h3 className="font-bold text-lg mb-2 text-black">✓ Objetivos Aceptados:</h3>
                        <div className="whitespace-pre-wrap p-4 bg-gray-100 rounded-lg">
                             <HtmlTypewriter htmlContent={finalText.replace(/\n/g, '<br />')} />
                        </div>
                    </div>
                )}
             </div>
        )
    }


    return (
        <div className="w-full mt-8 space-y-6">
             {view !== 'accepted' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <p className="text-black italic mb-4">{pedagogicalText}</p>
                    <div className="space-y-4">
                        {structureFields.map(field => (
                            <div key={field.key}>
                                <label className="block mb-1 text-sm font-bold text-black">{field.label}</label>
                                <input
                                    type="text"
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleInputChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}


            {(view === 'initial' || view === 'composed') && composedText.length > 2 && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Visualización del texto completo:</h3>
                    {isEditing ? (
                        <div>
                             <textarea value={finalText} onChange={(e) => setFinalText(e.target.value)} className="w-full h-24 p-3 bg-gray-100 rounded-lg"/>
                             <div className="flex justify-end mt-2"><button onClick={handleSaveEdit} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button></div>
                        </div>
                    ) : (
                        <p className="p-4 bg-gray-100 rounded-lg whitespace-pre-wrap">{composedText}</p>
                    )}
                    
                    {improvedText && !isEditing && (
                        <div className="mt-4">
                            <h3 className="font-bold text-lg mb-2 text-black">Versión mejorada del texto:</h3>
                            <p className="p-4 bg-gray-100 border border-gray-200 rounded-lg text-black">{improvedText}</p>
                        </div>
                    )}
                    
                    <div className="flex gap-2 sm:gap-4 mt-6 flex-wrap">
                         <button onClick={handleImprove} disabled={!!isLoading || isEditing} className="flex-grow py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                             {isLoading === 'improve' ? 'Corrigiendo...' : 'Corregir sintaxis'}
                        </button>
                         <button onClick={handleEditClick} disabled={!!isLoading || isEditing} className="flex-grow py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                            Editar
                        </button>
                        <button onClick={handleRobustify} disabled={!!isLoading || isEditing} className="flex-grow py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                             {isLoading === 'robustify' ? 'Buscando...' : 'Iterar'}
                        </button>
                         <button onClick={handleAccept} disabled={!!isLoading || isEditing} className="flex-grow py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                            {getAcceptButtonText()}
                        </button>
                    </div>
                </div>
            )}
            
            {view === 'robust_options' && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-lg mb-4">Elige una de las propuestas de la IA:</h3>
                    <div className="space-y-3">
                        {robustOptions.map((option, index) => (
                            <button key={index} onClick={() => handleSelectRobustOption(option)}
                                className={`w-full text-left p-4 border-2 rounded-lg transition ${selectedRobustOption === option ? 'border-black bg-blue-50' : 'border-gray-200 hover:border-gray-400'}`}>
                                 {index <= animatingIndex ?
                                    <HtmlTypewriter
                                        htmlContent={option}
                                        onComplete={() => {
                                            if (index === animatingIndex) {
                                                setAnimatingIndex(prev => prev + 1);
                                            }
                                        }}
                                    />
                                    : <div className="h-10"></div>
                                }
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            {selectedRobustOption && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedRobustOption(null)}>
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-left animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Propuesta Generada</h3>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            {isEditing ? (
                                <textarea value={finalText} onChange={(e) => setFinalText(e.target.value)} className="w-full h-24 p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none" />
                            ): (
                                <HtmlTypewriter htmlContent={`<p>${finalText}</p>`} className="text-black" onComplete={() => setIsAnimating(false)} />
                            )}
                        </div>
                         <div className="flex gap-4 mt-4">
                            <button onClick={() => { setIsEditing(true); setSelectedRobustOption(finalText); }} disabled={isAnimating || isEditing} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">Editar</button>
                            <button onClick={handleRobustify} disabled={isAnimating} className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">Iterar</button>
                            <button onClick={handleAcceptAndClosePopup} disabled={isAnimating} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">Aceptar</button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'accepted' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in border-2 border-black">
                    <h3 className="font-bold text-lg mb-2 text-black">✓ Aceptado:</h3>
                    <div className="p-4 bg-gray-100 rounded-lg text-black">
                        <HtmlTypewriter htmlContent={finalText.replace(/\n/g, '<br />')} />
                    </div>
                </div>
            )}

            {(isLoading) && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                     <p className="text-black mt-2">{isLoading === 'improve' ? 'Corrigiendo sintaxis...' : 'Buscando enfoques alternativos...'}</p>
                </div>
            )}
            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};

export default StructuredContentBuilder;