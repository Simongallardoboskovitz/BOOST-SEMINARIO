import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface DisciplinaryScopeProps {
    profile: Profile | null;
    topic: string;
    themeExplorationAiResponse: string;
    userInput: string;
    onUserInputChange: (value: string) => void;
    aiResponse: string;
    onAiResponseChange: (newResponse: string) => void;
    setIsAiTyping: (isTyping: boolean) => void;
    onAiResponseComplete: () => void;
    onAccept: () => void;
}

const DisciplinaryScope: React.FC<DisciplinaryScopeProps> = ({ 
    profile, 
    topic, 
    themeExplorationAiResponse,
    userInput,
    onUserInputChange,
    aiResponse, 
    onAiResponseChange, 
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
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const generateAiContent = async (isIteration = false) => {
        if (!userInput.trim()) {
            setError('Por favor, completa tu reflexión para continuar.');
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
                'TAREA DE ITERACIÓN: Itera sobre la propuesta anterior. Ofrece 3 nuevos autores o enfoques distintos, manteniendo la misma estructura y objetivo.' :
                `TAREA: Basado en el contexto proporcionado, busca tres autores relevantes cuya obra esté conectada con el ámbito del diseño que el estudiante mencionó. Para cada autor:
1.  Resume brevemente su enfoque o postura.
2.  Muestra puntos de coincidencia y diferencia entre ellos.
3.  Resalta los puntos donde abren nuevas perspectivas que permiten comprender mejor el tema del estudiante desde el diseño.`;

            const prompt = `Actúa como un mentor académico experto para ${studentName}.
**Contexto del Estudiante:**
*   **Tema:** "${topic}"
*   **Exploración Previa:** "${stripHtml(themeExplorationAiResponse)}"
*   **Reflexión del estudiante sobre el Diseño:** "${userInput}"

${iterationInstruction}

El objetivo es robustecer la reflexión disciplinar del estudiante, mostrando cómo el diseño puede expandir o transformar su mirada sobre el tema que está explorando.
La respuesta debe ser clara, académica y de tono colaborativo.

**Formato de Salida OBLIGATORIO:**
*   Utiliza HTML simple: <p>, <ul>, <li>, <strong>.
*   Usa <strong> únicamente para los conceptos clave y nombres de autores/proyectos.`;

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
                setError('Hubo un error al contactar la IA. Por favor, intenta de nuevo.');
            }
        } finally {
            setIsLoading(false);
            setIsAiTyping(false); 
            // The animation completion will handle setting isAnimating to false
        }
    };
    
    const onAnimationComplete = () => {
        setIsAnimating(false);
        // We removed setIsAiTyping(false) from here as it should be turned off when generation finishes, not when typing finishes.
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
            {!aiResponse ? (
                <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <p className="mb-4 text-gray-700">Aquí puedes escribir con tus palabras cómo crees que el diseño se conecta con tu tema o problema. No necesitas que sea perfecto; esto servirá como base para que la IA lo fortalezca.</p>
                    <textarea
                        value={userInput}
                        onChange={(e) => onUserInputChange(e.target.value)}
                        placeholder="Escribe aquí tu reflexión sobre el campo de diseño relacionado..."
                        className={textareaStyle}
                        aria-label="Caja para escribir reflexión sobre el ámbito de diseño"
                    />
                    <button
                        onClick={() => generateAiContent(false)}
                        disabled={isLoading || !userInput.trim()}
                        className="w-full mt-4 py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading ? 'Buscando...' : 'Buscar autores y robustecer'}
                    </button>
                    {error && <p className="text-black font-bold text-sm mt-2">{error}</p>}
                </div>
            ) : null}

            {(isLoading && !aiResponse) && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-black mt-2">Robusteciendo tu reflexión...</p>
                </div>
            )}
            
            {error && !aiResponse && <p className="text-black font-bold text-sm mt-4 text-center">{error}</p>}

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

                    <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                        <button onClick={handleEdit} disabled={isAnimating || isAccepted || isEditing} className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">✍️ Editar</button>
                        <button onClick={() => generateAiContent(true)} disabled={isAnimating || isAccepted || isEditing} className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed">🔁 Iterar</button>
                        <button onClick={handleAccept} disabled={isAnimating || isAccepted || isEditing} className="w-full py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed">
                            {isAccepted ? 'Aceptado ✔' : 'Aceptar respuesta'}
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};

export default DisciplinaryScope;