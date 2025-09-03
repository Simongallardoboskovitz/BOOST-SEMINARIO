import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface ProjectProposalProps {
    onAccept: (data: string) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

const ProjectProposal: React.FC<ProjectProposalProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [introSummary, setIntroSummary] = useState('');
    const [isSummaryLoading, setIsSummaryLoading] = useState(true);
    const [valueProp, setValueProp] = useState('');
    
    const [proposalPopupContent, setProposalPopupContent] = useState('');
    const [showProposalPopup, setShowProposalPopup] = useState(false);
    const [isEditingProposal, setIsEditingProposal] = useState(false);
    const [finalText, setFinalText] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [view, setView] = useState<'initial' | 'accepted'>('initial');

    const stripHtml = (html: string) => {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    };

    useEffect(() => {
        const generateIntroSummary = async () => {
            setIsSummaryLoading(true);
            setIsAiTyping(true);
            setError('');
            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const prompt = `Actúa como un sintetizador de investigación experto. Revisa la información clave del proyecto de un estudiante y genera un resumen muy sintético (2-3 frases). El resumen debe destacar el léxico clave de los hallazgos para orientar al estudiante a escribir su propuesta de valor.
                
Contexto:
- Objetivo General: "${allData.generalObjective}"
- Brecha de Diseño Identificada: "${allData.projectGapAnalysis}"
- Conclusiones del Análisis de Referentes: "${stripHtml(allData.referenceAnalysis?.benchmark || 'No disponible')}"

Tarea: Crea un párrafo introductorio conciso que integre estos elementos, destacando en negrita (<strong>) los conceptos más importantes que deberían guiar la propuesta de valor. El objetivo es dar léxico útil, no resumir todo. Usa HTML.`;

                const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
                setIntroSummary(response.text);
            } catch (err) {
                console.error("Error generating intro summary:", err);
                setIntroSummary("<p>Después de analizar los referentes y definir tus objetivos, es momento de articular una propuesta de valor clara. Piensa en cómo tu proyecto puede aprovechar los vacíos y oportunidades identificados.</p>");
                setError("No se pudo generar el resumen introductorio. Se usará un texto estándar.");
            } finally {
                setIsSummaryLoading(false);
                setIsAiTyping(false);
            }
        };

        generateIntroSummary();
    }, [allData.generalObjective, allData.projectGapAnalysis, allData.referenceAnalysis]);

    const handleArticulate = async (isIteration = false) => {
        if (!valueProp.trim()) {
            setError('Por favor, escribe tu propuesta de valor.');
            return;
        }
        setIsLoading(true);
        setIsAiTyping(true);
        setError('');
        if (!isIteration) {
            setProposalPopupContent('');
            setShowProposalPopup(true);
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
Actúa como un estratega de diseño y mentor. El estudiante ${profile?.nombre || 'estudiante'} ha completado una investigación previa y ha definido una propuesta de valor.
**Contexto Previo:**
*   Objetivo General (Paso 9): "${allData.generalObjective}"
*   Análisis de Referentes (Paso 11): ${JSON.stringify(allData.referenceAnalysis?.references.map(r => r.name))}
**Propuesta de Valor del Estudiante:**
"${valueProp}"
**Tarea ${isIteration ? '(Iteración)' : ''}:**
Articula UNA ÚNICA propuesta de proyecto concisa y convincente. La propuesta debe integrar la "propuesta de valor" del estudiante con su objetivo y los referentes analizados. No debe superar las 140 palabras.
${isIteration ? 'Genera una variante con un pequeño ajuste o un enfoque levemente distinto a la vez anterior.' : ''}
No uses títulos ni numeración.`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setProposalPopupContent(response.text);
        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al articular las propuestas.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsAiTyping(false);
        }
    };
    
    const handleAcceptFromPopup = () => {
        onAccept(proposalPopupContent);
        setView('accepted');
        setFinalText(proposalPopupContent);
        setShowProposalPopup(false);
        setIsEditingProposal(false);
    };

    const handleIterateFromPopup = () => {
        setIsEditingProposal(false);
        handleArticulate(true);
    };

    return (
        <div className="w-full mt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                {isSummaryLoading ? (
                     <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        <p className="text-black mt-2">Generando resumen contextual...</p>
                    </div>
                ) : (
                     <div className="mb-4 text-black prose max-w-none">
                        <HtmlTypewriter htmlContent={introSummary} speed={20} />
                    </div>
                )}
                <label htmlFor="valueProp" className="block mb-2 font-bold text-black">¿Cuál es tu propuesta de valor?</label>
                <textarea
                    id="valueProp"
                    value={valueProp}
                    onChange={(e) => setValueProp(e.target.value)}
                    placeholder="Escribe tu idea en el cuadro siguiente"
                    className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                />
                <button onClick={() => handleArticulate(false)} disabled={isLoading || isSummaryLoading || !valueProp.trim()}
                    className="w-full mt-4 py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                    {isLoading ? 'Articulando...' : 'Articular propuestas con IA'}
                </button>
            </div>
            
            {showProposalPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowProposalPopup(false)}>
                    <div className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full text-left animate-fade-in" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">Propuesta de Proyecto Generada</h3>
                        <div className="p-4 bg-gray-50 rounded-lg min-h-[120px] flex items-center justify-center">
                            {isLoading ? (
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                            ) : isEditingProposal ? (
                                <textarea 
                                    value={proposalPopupContent} 
                                    onChange={(e) => setProposalPopupContent(e.target.value)} 
                                    className="w-full h-32 p-2 border rounded-lg bg-white"
                                />
                            ) : (
                                <p className="text-black">{proposalPopupContent}</p>
                            )}
                        </div>
                        <div className="flex gap-4 mt-6">
                             <button 
                                onClick={() => setIsEditingProposal(true)} 
                                disabled={isEditingProposal || isLoading} 
                                className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50"
                            >
                                Editar
                            </button>
                             <button 
                                onClick={handleIterateFromPopup} 
                                disabled={isLoading} 
                                className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50"
                            >
                                Iterar
                            </button>
                             <button 
                                onClick={handleAcceptFromPopup} 
                                disabled={isLoading} 
                                className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {view === 'accepted' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in border-2 border-black">
                    <h3 className="font-bold text-lg mb-2 text-black">✓ Propuesta de Proyecto Aceptada:</h3>
                    <p className="p-4 bg-gray-100 rounded-lg text-black">{finalText}</p>
                </div>
            )}
            
            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};

export default ProjectProposal;