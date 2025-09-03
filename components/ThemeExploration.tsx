import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface ThemeExplorationProps {
    profile: Profile | null;
    topic: string;
    onTopicChange: (newTopic: string) => void;
    aiResponse: string;
    onAiResponseChange: (newResponse: string) => void;
    setIsAiTyping: (isTyping: boolean) => void;
    onAiResponseComplete: () => void;
}

const ThemeExploration: React.FC<ThemeExplorationProps> = ({ profile, topic, onTopicChange, aiResponse, onAiResponseChange, setIsAiTyping, onAiResponseComplete }) => {
    const [bibliography, setBibliography] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedResponse, setEditedResponse] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [podcastGenerated, setPodcastGenerated] = useState(false);
    
    const stripHtml = (html: string) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }
    
    const generateAiContent = async (isIteration = false) => {
        if (!topic.trim()) {
            setError('Por favor, escribe tu tema antes de continuar.');
            return;
        }
        setError('');
        setIsLoading(true);
        setIsAnimating(true);
        setIsAiTyping(true);
        onAiResponseChange('');
        setBibliography('');
        setIsEditing(false);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const studentName = profile?.nombre || 'estudiante';
            
            const socraticPrompt = `Actúa como un mentor académico experto para ${studentName}, ayudándole a profundizar en su tema: "${topic}".
${isIteration ? 'TAREA: Itera sobre la propuesta anterior. Ofrece 2 nuevos autores o perspectivas alternativas y contrástalas con las ideas originales.' : ''}

**Prioridad de Fuentes:**
1.  **Chile:** INE, SUBDERE, MINEDUC, Casen, BCN.
2.  **Académicas:** Scielo, Redalyc, Dialnet.
3.  **Otras:** Fuentes abiertas bien citadas.

**Instrucciones de formato y contenido OBLIGATORIAS:**
1.  **Título:** Inicia con un título en mayúsculas y peso Black. Ejemplo: <h3 class="text-black font-black text-center uppercase">CITAR Y ROBUSTECER</h3>
2.  **Párrafo Introductorio:** Conecta 3 autores/conceptos clave para "${topic}".
3.  **Citas y Análisis:** Incluye 1-2 citas textuales directas y breves de los autores. Para cada cita, proporciona la referencia en formato APA 7 y un hipervínculo a la fuente si es posible. Usa <strong> para resaltar solo **palabras clave**, no frases.
4.  **Párrafo Comparativo:** Describe similitudes y luego diferencias entre las ideas.
5.  **Párrafo de Conexión al Diseño:** Conecta el tema con 2-3 áreas amplias del diseño. En lugar de subdisciplinas muy específicas, enfócate en campos como **diseño estratégico, diseño de interacción, diseño social, diseño especulativo, diseño crítico, diseño de experiencias, etc.**
6.  **Bibliografía:** Al final de TODA la respuesta, agrega un bloque de bibliografía en formato APA 7 estricto, envuelto en <div id="bibliografia">. Ejemplo: <div id="bibliografia"><h3>Bibliografía</h3><p>Apellido, N. (Año). <em>Título del trabajo</em>. Editorial.</p></div>
7.  **Estilo:** Tono colaborativo. HTML simple. Cuerpo del texto en fuente regular.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: socraticPrompt,
            });
            
            const fullResponse = response.text;
            const biblioRegex = /<div id="bibliografia"[\s\S]*?>[\s\S]*?<\/div>/i;
            const biblioMatch = fullResponse.match(biblioRegex);
            const mainText = fullResponse.replace(biblioRegex, '').trim();
            const biblioText = biblioMatch ? biblioMatch[0] : '';
            
            onAiResponseChange(mainText);
            setBibliography(biblioText);

        } catch (err: any) {
            console.error(err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Hubo un error al contactar la IA. Por favor, intenta de nuevo.');
            }
            setIsAnimating(false);
            setIsAiTyping(false);
        } finally {
            setIsLoading(false);
        }
    }

    const handleInitialRequest = () => generateAiContent(false);
    const handleIterationRequest = () => generateAiContent(true);

    const handleEdit = () => {
        setEditedResponse(stripHtml(aiResponse));
        setIsEditing(true);
    };

    const handleSave = () => {
        const newHtml = '<p>' + editedResponse.replace(/\n/g, '</p><p>') + '</p>';
        onAiResponseChange(newHtml);
        setIsEditing(false);
    };

    const handleGeneratePodcast = () => {
        if ('speechSynthesis' in window && aiResponse) {
            const textToSpeak = stripHtml(aiResponse);
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-ES';
            window.speechSynthesis.speak(utterance);
            setPodcastGenerated(true);
        } else {
            alert('Lo sentimos, tu navegador no soporta la síntesis de voz.');
        }
    };

    const onAnimationComplete = () => {
        setIsAnimating(false);
        setIsAiTyping(false);
        onAiResponseComplete();
    }
    
    const textareaStyle = "w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black font-normal placeholder-gray-400 resize-y";

    return (
        <div className="w-full">
            <div className="mt-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
                <textarea
                    value={topic}
                    onChange={(e) => onTopicChange(e.target.value)}
                    placeholder="Escribe aquí tu idea, borrador o tema..."
                    className={textareaStyle}
                    aria-label="Caja para escribir tu tema"
                ></textarea>

                <button
                    onClick={handleInitialRequest}
                    disabled={isLoading || isAnimating || !!aiResponse}
                    className="w-full mt-4 py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading || isAnimating ? 'Analizando...' : 'Revisar autores y robustecer'}
                </button>
                 {error && <p className="text-black font-bold text-sm mt-2">{error}</p>}
            </div>

            {(isLoading || isAnimating) && !aiResponse && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-black mt-2">Buscando conexiones...</p>
                </div>
            )}

            {aiResponse && (
                <div className="mt-6 bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    {isEditing ? (
                        <div>
                            <textarea
                                value={editedResponse}
                                onChange={(e) => setEditedResponse(e.target.value)}
                                className="w-full h-48 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black font-normal resize-y"
                                aria-label="Editar propuesta de IA"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300">Cancelar</button>
                                <button onClick={handleSave} className="py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800">Guardar Cambios</button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <HtmlTypewriter
                                htmlContent={aiResponse}
                                className="prose prose-lg max-w-none prose-strong:font-bold text-gray-800 font-normal"
                                onComplete={onAnimationComplete}
                            />
                            {bibliography && (
                                <div className="mt-4 border-t pt-4">
                                     <HtmlTypewriter
                                        htmlContent={bibliography}
                                        className="prose prose-lg max-w-none prose-strong:font-bold text-gray-800 font-normal"
                                    />
                                </div>
                            )}
                             <div className="flex flex-col gap-2 mt-4 border-t pt-4">
                                <button onClick={handleEdit} disabled={isAnimating} className="w-full py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">✏️ Editar propuesta</button>
                                <button onClick={handleIterationRequest} disabled={isAnimating || podcastGenerated} className="w-full py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">¿Deseas iterarlo?</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

        </div>
    );
};

export default ThemeExploration;