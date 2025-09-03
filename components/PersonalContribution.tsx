import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface PersonalContributionProps {
    contribution: string;
    onContributionChange: (newContribution: string) => void;
    aiResponse: string;
    onAiResponseChange: (newResponse: string) => void;
    profile: Profile | null;
    topic: string;
    themeExplorationAiResponse: string;
    disciplinaryScopeAiResponse: string;
    setIsAiTyping: (isTyping: boolean) => void;
    onAiResponseComplete: () => void;
    onAccept: () => void;
}

const PersonalContribution: React.FC<PersonalContributionProps> = ({ 
    contribution, 
    onContributionChange, 
    aiResponse,
    onAiResponseChange,
    profile, 
    topic,
    themeExplorationAiResponse,
    disciplinaryScopeAiResponse,
    setIsAiTyping, 
    onAiResponseComplete,
    onAccept
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedResponse, setEditedResponse] = useState('');
    const [isEditedManually, setIsEditedManually] = useState(false);

    const stripHtml = (html: string) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const generateAiContent = async (isIteration = false) => {
        if (!contribution.trim()) {
            setError('Por favor, escribe tu reflexión para continuar.');
            return;
        }
        setError('');
        setIsLoading(true);
        setIsAnimating(true);
        setIsAiTyping(true);
        if(!isIteration) onAiResponseChange('');
        setIsEditing(false);
        setIsAccepted(false);
        setIsEditedManually(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const studentName = profile?.nombre || 'estudiante';
            
            const iterationInstruction = isIteration ? 
                'TAREA DE ITERACIÓN: Itera sobre la propuesta anterior. Busca otros autores o enfoques para enriquecer la contribución del estudiante, manteniendo la estructura y el párrafo final de cierre.' :
                'TAREA: Busca autores y enfoques que ajudem a sustentar esa forma de contribuir. Genera una propuesta enriquecida, incluyendo un párrafo final de cierre.';

            const prompt = `Actúa como un mentor académico experto en diseño e investigación. El estudiante ${studentName} está reflexionando sobre cómo su proyecto puede contribuir a resolver un problema.

**Contexto Completo del Proyecto:**
*   **Tema:** "${topic}"
*   **Exploración Temática (Autores y Conceptos Clave):** "${stripHtml(themeExplorationAiResponse)}"
*   **Ámbito Disciplinar y Autores Relevantes:** "${stripHtml(disciplinaryScopeAiResponse)}"
*   **Idea/Intención de Ayuda del Estudiante (Lo que acaba de escribir):** "${contribution}"

**${iterationInstruction}**

**Estructura de la Respuesta (OBLIGATORIA):**
1.  **Análisis Enriquecido:** Comienza analizando la idea del estudiante. Luego, introduce 2-3 autores o conceptos clave que la respalden o la expandan. Explica brevemente cada uno y cómo se conecta con la intención del estudiante.
2.  **Párrafo Final de Cierre:** Concluye con un párrafo reflexivo y proyectivo que haga lo siguiente:
    *   Sintetiza las conclusiones del análisis.
    *   Muestra cómo se construye una respuesta situada y crítica al problema.
    *   Sostiene la importancia de adoptar un nuevo enfoque desde el diseño.
    *   Reafirma al diseño como un articulador de soluciones transformadoras.

**Instrucciones de Formato:**
*   Usa HTML simple: <p>, <strong>, <em>, <ul>, <li>.
*   Usa <strong> para los nombres de autores y conceptos clave.
*   El tono debe ser de apoyo, académico y claro, motivando al estudiante.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            onAiResponseChange(response.text);

        } catch (err: any) {
            console.error(err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Hubo un error al generar la sugerencia. Intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
            setIsAiTyping(false);
        }
    };
    
    const onAnimationComplete = () => {
        setIsAnimating(false);
        onAiResponseComplete();
    };

    const handleEdit = () => {
        setEditedResponse(stripHtml(aiResponse));
        setIsEditing(true);
    };

    const handleSave = () => {
        const newHtml = '<p>' + editedResponse.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') + '</p>';
        onAiResponseChange(newHtml);
        setIsEditing(false);
        setIsEditedManually(true);
    };

    const handleAccept = () => {
        setIsAccepted(true);
        onAccept();
    };

    const textareaStyle = "w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black font-normal placeholder-gray-400 resize-y";

    return (
        <div className="w-full">
            {!aiResponse && !isLoading ? (
                <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <p className="mb-4 text-gray-700">Aquí puedes escribir libremente una idea, intención o hipótesis de ayuda o contribución. No necesitas tener la respuesta perfecta; esta será fortalecida por la IA.</p>
                    <textarea
                        value={contribution}
                        onChange={(e) => onContributionChange(e.target.value)}
                        placeholder="Escribe aquí tu idea, intención o hipótesis de ayuda..."
                        className={textareaStyle}
                        aria-label="Caja para escribir contribución"
                    />
                    <button
                        onClick={() => generateAiContent(false)}
                        disabled={isLoading || !contribution.trim()}
                        className="w-full mt-4 py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Buscando...' : 'Buscar autores y robustecer'}
                    </button>
                    {error && <p className="text-black font-bold text-sm mt-2">{error}</p>}
                </div>
            ) : null}

            {isLoading && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-black mt-2">Enriqueciendo tu reflexión...</p>
                </div>
            )}

            {aiResponse && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    {isEditing ? (
                        <div>
                            <textarea
                                value={editedResponse}
                                onChange={(e) => setEditedResponse(e.target.value)}
                                className={`${textareaStyle} h-64`}
                                aria-label="Editar propuesta de IA"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300">Cancelar</button>
                                <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                             <div className="p-4 bg-transparent border-0 rounded-none text-black font-normal">
                                {isEditedManually ? (
                                    <div className="prose prose-lg max-w-none prose-strong:font-bold text-gray-800 font-normal" dangerouslySetInnerHTML={{ __html: aiResponse }} />
                                ) : (
                                    <HtmlTypewriter
                                        htmlContent={aiResponse}
                                        className="prose prose-lg max-w-none prose-strong:font-bold text-gray-800 font-normal"
                                        onComplete={onAnimationComplete}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                    
                    {!isEditing && (
                        <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                            <button onClick={() => generateAiContent(true)} disabled={isAnimating || isAccepted} className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">🔁 Iterar</button>
                            <button onClick={handleEdit} disabled={isAnimating || isAccepted} className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">✍️ Editar</button>
                            <button onClick={handleAccept} disabled={isAnimating || isAccepted} className="w-full py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed">
                                {isAccepted ? 'Aceptado ✔' : 'Aceptar'}
                            </button>
                        </div>
                    )}

                </div>
            )}
        </div>
    );
};

export default PersonalContribution;