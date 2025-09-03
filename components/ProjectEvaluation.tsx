import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface ProjectEvaluationProps {
    onAccept: (data: any) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

const ProjectEvaluation: React.FC<ProjectEvaluationProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [evaluationResult, setEvaluationResult] = useState<string>('');
    const [brechas, setBrechas] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBrechasLoading, setIsBrechasLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState('');

    const handleEvaluate = async () => {
        setIsLoading(true);
        setIsAiTyping(true);
        setError('');
        setEvaluationResult('');
        setBrechas('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
Actúa como un evaluador académico senior, basándote en la Rúbrica de Evaluación de Taller de Título de Diseño UDP. Analiza el siguiente proyecto de título y evalúalo usando la rúbrica oficial proporcionada.
**Rúbrica de Evaluación:**
1.  **Coherencia y Pertinencia:** ¿Hay una línea clara entre el problema, la pregunta, la hipótesis y los objetivos?
2.  **Fundamentación Teórica:** ¿El marco teórico y los referentes son sólidos y están bien articulados con el proyecto?
3.  **Propuesta de Valor e Innovación:** ¿La propuesta de proyecto es clara, innovadora y responde a una oportunidad detectada?
4.  **Viabilidad y Metodología:** ¿El enfoque metodológico y el plan de trabajo son realistas y adecuados?

**Información del Proyecto:**
${JSON.stringify(allData, null, 2)}

**Tarea:**
Genera una tabla en HTML (usa <table>, <tr>, <td>, <th>, <strong>) con dos columnas: "Criterio de evaluación" y "Comentarios (aspectos presentes y brechas de mejora)". Para cada uno de los 4 criterios de la rúbrica, provee un comentario detallado, destacando fortalezas y debilidades. Todo el texto debe ser de color negro.`;
            
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setEvaluationResult(response.text);

        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al realizar la evaluación.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsAiTyping(false);
        }
    };
    
    const handleIdentifyBrechas = async (isReprioritize = false) => {
        setIsBrechasLoading(true);
        setIsAiTyping(true);
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Basado en esta evaluación en HTML: ${evaluationResult}, ${isReprioritize ? 're-prioriza y' : ''} genera un resumen en un párrafo con las recomendaciones. Destaca los 2-3 aspectos clave en los que el estudiante debe enfocarse para fortalecer su proyecto.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setBrechas(response.text);
            setIsEditing(false);
        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al identificar las brechas.');
            }
            console.error(err);
        } finally {
            setIsBrechasLoading(false);
            setIsAiTyping(false);
        }
    };
    
    const handleAccept = () => {
        onAccept({ evaluation: evaluationResult, brechas });
    };

    return (
        <div className="w-full mt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <button onClick={handleEvaluate} disabled={isLoading}
                    className="w-full max-w-sm mx-auto py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                    {isLoading && !evaluationResult ? 'Evaluando...' : 'Evaluar con rúbrica oficial'}
                </button>
            </div>

            {evaluationResult && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-4" style={{ color: '#000000' }}>Resultados de la Evaluación</h3>
                    <div className="prose max-w-none prose-p:text-black prose-td:text-black prose-th:text-black" dangerouslySetInnerHTML={{ __html: evaluationResult }} />
                    
                    {!brechas && (
                        <div className="text-center mt-6">
                            <button onClick={() => handleIdentifyBrechas(false)} disabled={isBrechasLoading}
                                className="py-2 px-5 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                                {isBrechasLoading ? 'Identificando...' : 'Identificar principales brechas de mejora'}
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {brechas && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-4" style={{ color: '#000000' }}>Recomendaciones Priorizadas</h3>
                    {isEditing ? (
                        <div>
                            <textarea
                                value={brechas}
                                onChange={(e) => setBrechas(e.target.value)}
                                className="w-full h-32 p-2 border rounded-lg"
                            />
                            <div className="flex justify-end mt-2">
                                <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-black">{brechas}</p>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-2 mt-6 border-t pt-4">
                        <button onClick={() => setIsEditing(true)} disabled={isBrechasLoading || isEditing} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">Editar</button>
                        <button onClick={() => handleIdentifyBrechas(true)} disabled={isBrechasLoading || isEditing} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">Repriorizar</button>
                        <button onClick={handleAccept} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-bold">Aceptar y continuar</button>
                    </div>
                </div>
            )}
            
            {error && <p className="text-black font-bold mt-4 text-center">{error}</p>}
        </div>
    );
};

export default ProjectEvaluation;