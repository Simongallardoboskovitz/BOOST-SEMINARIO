import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile, WorkPlanTask } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface WorkPlanProps {
    onAccept: (data: { tasks: WorkPlanTask[], ganttChart: string }) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

const WorkPlan: React.FC<WorkPlanProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [tasks, setTasks] = useState<WorkPlanTask[]>([
        { id: 1, text: '' },
        { id: 2, text: '' },
        { id: 3, text: '' },
    ]);
    const [ganttChart, setGanttChart] = useState<string>('');
    const [keyActivities, setKeyActivities] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isActivitiesLoading, setIsActivitiesLoading] = useState(false);
    const [isActivitiesAnimationDone, setIsActivitiesAnimationDone] = useState(false);
    const [error, setError] = useState('');

    const handleTaskChange = (id: number, text: string) => {
        setTasks(prevTasks => prevTasks.map(task => task.id === id ? { ...task, text } : task));
    };
    
    const handleGenerateActivities = async () => {
        setIsActivitiesLoading(true);
        setIsAiTyping(true);
        setError('');
        setKeyActivities('');
        setIsActivitiesAnimationDone(false);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Basado en el progreso del proyecto de un estudiante hasta ahora, lista las actividades clave que debería considerar para el próximo semestre.
**Contexto del Proyecto:**
*   Objetivos: ${JSON.stringify(allData.specificObjectives)}
*   Propuesta de Proyecto: ${allData.projectProposal}
*   Brechas de la Evaluación: ${allData.projectEvaluation?.brechas || 'No identificadas'}
**Tarea:** Genera una lista HTML (<ul><li>) de actividades clave. Sé específico y accionable.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setKeyActivities(response.text);
        } catch (err) {
            setError('Error al generar las actividades clave.');
            console.error(err);
        } finally {
            setIsActivitiesLoading(false);
            setIsAiTyping(false);
        }
    };

    const handleGeneratePlan = async () => {
        if (tasks.some(t => !t.text.trim())) {
            setError('Por favor, define las tres tareas principales.');
            return;
        }
        setIsLoading(true);
        setIsAiTyping(true);
        setError('');
        setGanttChart('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
Actúa como un jefe de proyecto experto. El estudiante necesita un plan de trabajo tipo carta Gantt para su proyecto.
**Tareas Principales Definidas por el Estudiante:**
1.  "${tasks[0].text}"
2.  "${tasks[1].text}"
3.  "${tasks[2].text}"

**Calendario Académico (Segundo Semestre):**
*   Agosto: Semanas 1-4
*   Septiembre: Semanas 5-8
*   Octubre: Semanas 9-12
*   Noviembre: Semanas 13-16
*   Diciembre: Semanas 17-19

**Tarea:**
Genera una planificación tipo carta Gantt en formato de tabla HTML para los meses de Agosto a Diciembre. La tabla debe ser realista y estar bien distribuida.
*   **Columnas:** La primera columna será "Tarea". Las siguientes columnas representarán cada semana del semestre, agrupadas por mes (ej. "Ag-S1", "Ag-S2", ..., "Dic-S3").
*   **Contenido:** Distribuye las tres tareas principales, sus subtareas lógicas y las actividades clave a lo largo de las semanas.
*   **Estilo:** Para las barras de la Gantt, usa un color de fondo en la celda (ej. style="background-color: #dbeafe;"). El texto en todas las celdas (coloreadas o no) debe ser negro.

**Actividades Clave a Incluir (basado en rúbrica y contexto):** Además de las tareas del estudiante, asegúrate de incorporar estas actividades en el plan, prestando atención a las brechas detectadas en la evaluación del proyecto:
- Iteraciones con usuarios (al menos 2)
- Maquetería y prototipado (rápido, formal, funcional)
- Definición tecnológica e insumos
- Testeo y validación
- Desarrollo de memoria/informe (principalmente segunda mitad)
- Preparación de montaje y defensa final
- Considerar las brechas de la evaluación: ${allData.projectEvaluation?.brechas || 'N/A'}`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setGanttChart(response.text);

        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al generar el plan de trabajo.');
            }
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsAiTyping(false);
        }
    };

    const handleAccept = () => {
        onAccept({ tasks, ganttChart });
    };

    return (
        <div className="w-full mt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="mb-4">Si tuvieras que definir las tres tareas principales que debes realizar para desarrollar tu proyecto el próximo semestre, ¿cuáles serían? Escribe tus ideas, indicando en qué aspectos crees que debes poner más énfasis.</p>
                <div className="space-y-3">
                    {tasks.map(task => (
                        <input
                            key={task.id}
                            type="text"
                            value={task.text}
                            onChange={(e) => handleTaskChange(task.id, e.target.value)}
                            placeholder={`Tarea ${task.id}`}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                        />
                    ))}
                </div>
                 <div className="mt-4 flex flex-col gap-2">
                     <button onClick={handleGenerateActivities} disabled={isActivitiesLoading} className="w-full py-3 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">
                        {isActivitiesLoading ? 'Listando...' : 'Itemizar actividades claves'}
                    </button>
                 </div>
            </div>

            {isActivitiesLoading && (
                 <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-black mt-2">Identificando actividades...</p>
                </div>
            )}
            
            {keyActivities && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-lg mb-2">Actividades Clave Sugeridas</h3>
                    <div className="prose max-w-none prose-li:text-black">
                        <HtmlTypewriter htmlContent={keyActivities} onComplete={() => setIsActivitiesAnimationDone(true)} />
                    </div>
                    {isActivitiesAnimationDone && (
                        <div className="mt-4 border-t pt-4">
                             <button onClick={handleGeneratePlan} disabled={isLoading || tasks.some(t => !t.text.trim())}
                                className="w-full py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                                {isLoading ? 'Generando Plan...' : 'Generar plan de trabajo'}
                            </button>
                        </div>
                    )}
                </div>
            )}

            {isLoading && !ganttChart && (
                <div className="mt-6 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                    <p className="text-black mt-2">Creando tu carta Gantt...</p>
                </div>
            )}

            {ganttChart && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-4">Plan de Trabajo Sugerido</h3>
                    <div className="overflow-x-auto border rounded-lg gantt-table-container">
                        <div className="prose prose-sm max-w-none p-2 prose-td:text-black prose-th:text-black" dangerouslySetInnerHTML={{ __html: ganttChart }} />
                    </div>
                    <button onClick={handleAccept} className="w-full mt-6 py-3 rounded-lg bg-black text-white font-bold">Aceptar y Continuar</button>
                </div>
            )}
            
            {error && <p className="text-black font-bold mt-4 text-center">{error}</p>}
        </div>
    );
};

export default WorkPlan;