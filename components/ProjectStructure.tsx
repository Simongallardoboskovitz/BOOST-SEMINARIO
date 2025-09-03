
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface ProjectStructureProps {
    profile: Profile | null;
    topic: string;
    themeExplorationAiResponse: string;
    disciplinaryScope: string;
    personalContribution: string;
    setIsAiTyping: (isTyping: boolean) => void;
    onAiResponseComplete: (data: string) => void;
}

const ProjectStructure: React.FC<ProjectStructureProps> = ({ 
    profile, 
    topic, 
    themeExplorationAiResponse,
    disciplinaryScope,
    personalContribution,
    setIsAiTyping, 
    onAiResponseComplete 
}) => {
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [view, setView] = useState<'initial' | 'gaps_displayed' | 'gap_selected'>('initial');

    const [gaps, setGaps] = useState<string[]>([]);
    const [selectedGap, setSelectedGap] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<string>('');
    
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    const identifyGaps = async () => {
        setError('');
        setIsLoading(true);
        setIsAnimating(true);
        setIsAiTyping(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const studentName = profile?.nombre || 'estudiante';
            
            const gapsPrompt = `Actúa como un mentor estratégico de investigación para ${studentName}.
**Contexto Completo del Proyecto:**
*   **Tema:** "${topic}"
*   **Exploración Temática (Paso 2):** ${stripHtml(themeExplorationAiResponse)}
*   **Ámbito Disciplinar (Paso 3):** ${stripHtml(disciplinaryScope)}
*   **Reflexión de Contribución (Paso 4):** "${personalContribution}"

**Tarea:**
Analiza toda la información anterior para identificar las **tres brechas o debilidades más relevantes** en la propuesta del estudiante. Estas brechas deben ser áreas de oportunidad claras para fortalecer el proyecto.

**Instrucciones de formato:**
1.  Genera una lista de exactamente TRES brechas.
2.  Cada brecha debe ser una frase concisa y accionable.
3.  Separa las tres brechas con el delimitador exacto: <!-- GAP -->
4.  No agregues numeración, viñetas ni ningún otro formato. Solo el texto de la brecha.
Ejemplo:
Falta de una conexión explícita entre la tecnología X y el problema social Y.<!-- GAP -->La definición del usuario objetivo es demasiado amplia y carece de especificidad.<!-- GAP -->El enfoque metodológico propuesto no parece adecuado para responder la pregunta de investigación.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: gapsPrompt,
            });

            const responseText = response.text;
            const foundGaps = responseText.split('<!-- GAP -->').map(g => g.trim()).filter(Boolean);
            setGaps(foundGaps);
            setView('gaps_displayed');

        } catch (err) {
            console.error(err);
            setError('Hubo un problema al identificar las brechas. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
            setIsAnimating(false);
            setIsAiTyping(false);
        }
    };
    
    const handleSelectGap = async (gap: string) => {
        setSelectedGap(gap);
        setView('gap_selected');
        setError('');
        setIsLoading(true);
        setIsAnimating(true);
        setIsAiTyping(true);
        setSuggestions('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
             const suggestionsPrompt = `Actúa como un mentor académico que ayuda a un estudiante a definir su proyecto.
**Contexto:** El estudiante ha identificado la siguiente brecha o área de enfoque para su proyecto: "${gap}".

**Tarea:**
Genera un texto de sugerencias para ayudar al estudiante a formular su estructura de proyecto (título, pregunta, objetivos). El texto debe ser inspirador y socrático.

**Instrucciones de formato:**
1.  **Título:** Inicia con un título en peso Black. Ejemplo: <h3 class="text-black font-black">Explorando la Brecha: ${gap}</h3>
2.  **Análisis de la Brecha:** En un párrafo, profundiza en por qué esta brecha es relevante y qué oportunidades de diseño presenta.
3.  **Preguntas Guía:** Ofrece 3-4 preguntas reflexivas en formato de lista (<ul><li>) para ayudar a definir:
    *   Una pregunta de investigación potente.
    *   Un objetivo general claro y alcanzable.
    *   Posibles objetivos específicos.
4.  **Conexión Final:** Cierra con un párrafo que anime al estudiante a usar estas reflexiones para completar su estructura de proyecto.
5.  **Formato:** Usa HTML simple (<p>, <h3>, <strong>, <ul>, <li>).`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: suggestionsPrompt,
            });
            
            setSuggestions(response.text);

        } catch (err) {
             console.error(err);
            setError('Hubo un problema al generar sugerencias. Intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const onAnimationDone = () => {
        setIsAnimating(false);
        setIsAiTyping(false);
        onAiResponseComplete(suggestions);
    };

    return (
        <div className="w-full">
            {view === 'initial' && (
                <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center">
                    <button
                        onClick={identifyGaps}
                        disabled={isLoading}
                        className="w-full py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-500"
                    >
                        {isLoading ? 'Analizando...' : 'Identificar brechas con IA'}
                    </button>
                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}
            
            {(isLoading && view === 'initial') && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-gray-600 mt-2">Identificando brechas relevantes...</p>
                </div>
            )}
            
            {view === 'gaps_displayed' && (
                <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold mb-4 text-center">Principales Brechas Identificadas</h3>
                    <p className="text-center text-gray-600 mb-6">Hemos identificado tres áreas clave donde tu proyecto puede tener un mayor impacto. Selecciona una para continuar.</p>
                    <div className="flex flex-col gap-4">
                        {gaps.map((gap, index) => (
                             <button
                                key={index}
                                onClick={() => handleSelectGap(gap)}
                                className="w-full text-left p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-black transition"
                            >
                                {gap}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {view === 'gap_selected' && (
                 <div className="w-full">
                    <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                        <h3 className="text-lg font-bold text-gray-800">Brecha Seleccionada:</h3>
                        <p className="mb-6 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">{selectedGap}</p>

                        {isLoading && !suggestions && (
                             <div className="mt-6 text-center">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                <p className="text-gray-600 mt-2">Generando sugerencias...</p>
                            </div>
                        )}
                        
                        {suggestions && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                 <HtmlTypewriter
                                    htmlContent={suggestions}
                                    className="prose prose-lg max-w-none prose-strong:font-bold text-gray-800 font-normal"
                                    onComplete={onAnimationDone}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
             {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
        </div>
    );
};

export default ProjectStructure;
