import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import HtmlTypewriter from './HtmlTypewriter';

declare var jspdf: any;
declare var html2canvas: any;

interface FinalReportProps {
    allData: any;
    onAccept: () => void;
}

const loadingPhrases = [
    "Compilando tu perfil y preferencias...",
    "Analizando la exploración temática...",
    "Sintetizando el marco disciplinar...",
    "Estructurando tu contribución personal...",
    "Integrando la pregunta de investigación y la hipótesis...",
    "Detallando los objetivos del proyecto...",
    "Compilando el análisis de referentes...",
    "Articulando la propuesta de proyecto...",
    "Generando la planificación y carta Gantt...",
    "Dando los toques finales al informe...",
];

const FinalReport: React.FC<FinalReportProps> = ({ allData, onAccept }) => {
    const [reportContent, setReportContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isRobustifying, setIsRobustifying] = useState(false);
    const [error, setError] = useState('');
    const reportRef = useRef<HTMLDivElement>(null);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentLoadingPhrase, setCurrentLoadingPhrase] = useState('');

    const runLoadingSequence = () => {
        setIsLoading(true);
        let i = 0;
        const interval = setInterval(() => {
            if (i < loadingPhrases.length) {
                setCurrentLoadingPhrase(loadingPhrases[i]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 1500);
        return interval;
    };


    const generateReport = async (isRobustify = false) => {
        let loadingInterval: NodeJS.Timeout | undefined;
        if (!isRobustify) {
            loadingInterval = runLoadingSequence();
        } else {
            setIsRobustifying(true);
        }
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
Actúa como un redactor académico experto. Tu tarea es generar un informe final de proyecto de título completo y coherente.
**Instrucciones Generales:**
*   **Sintetiza, no solo copies:** Usa la información proporcionada para redactar cada sección con un lenguaje académico fluido. Crea transiciones lógicas entre las secciones.
*   **Estructura del Informe (Obligatoria):** Sigue este índice exacto. Si falta información para una sección, indícalo como "Pendiente de desarrollo".
*   **Formato HTML:** Usa una estructura clara y profesional (<h1>, <h2>, <h3>, <p>, <ul>, <li>, <em>).
*   **Énfasis:** **NO uses negritas (<strong> o <b>).** Usa cursiva (<em> o <i>) solo cuando sea estrictamente necesario para enfatizar un concepto clave.
*   **Plan de Trabajo:** En la sección 13, incluye la carta Gantt HTML (de allData.workPlan.ganttChart) dentro de un div con la clase "gantt-container-for-pdf".
*   **Anexos:** En la sección 15, incluye el contenido de la guía de entrevista cuantitativa.

**Datos del Proyecto del Estudiante:**
${JSON.stringify(allData, null, 2)}

**${isRobustify ? 'TAREA DE ROBUSTECIMIENTO: Revisa el informe actual y mejóralo. Enriquece el lenguaje, fortalece las conexiones entre secciones y asegúrate de que el tono sea impecable y profesional, respetando todas las instrucciones de formato.' : 'TAREA: Genera el informe inicial siguiendo todas las instrucciones.'}**

**Índice a seguir:**
1.  Resumen / Abstract
2.  Introducción
3.  Motivación personal
4.  Marco teórico (Desarrolla los conceptos con base en los referentes)
5.  Antecedentes generales
6.  Tema central
7.  Diseño aplicado
8.  Contribución
9.  Usuarios tipo y testimonios (basado en User Persona)
10. Fundamentación (basado en Pregunta, Hipótesis, Objetivos)
11. Proyecto de creación (basado en la propuesta de proyecto)
12. Desarrollo y prototipado
13. Plan de Trabajo (La carta Gantt va aquí, dentro del div especificado)
14. Bibliografía (APA 7, de los referentes)
15. Anexos (Incluir aquí la guía cuantitativa: ${allData.userResearchData?.quantitativeGuide || 'Guía no disponible.'})
16. Evaluación según rúbrica (basado en la evaluación)
`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setReportContent(response.text);
            setIsEditing(false); // End editing after robustify
            if (!isRobustify) {
                onAccept();
            }

        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al generar el informe.');
            }
            console.error(err);
        } finally {
            if (loadingInterval) clearInterval(loadingInterval);
            setIsLoading(false);
            setIsRobustifying(false);
        }
    };
    
    const handleDownload = () => {
        if (!reportRef.current) return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF('l', 'pt', 'letter'); // 'l' for landscape
        const content = reportRef.current;

        const userName = allData.profile?.nombre || 'usuario';
        const projectTitle = (allData.projectProposal || 'Mi Proyecto').split(' ').slice(0, 5).join(' ');
        const fileName = `Esto no es una Memoria_${userName}_${projectTitle}.pdf`;
        
        doc.html(content, {
            callback: function (doc: any) {
                doc.save(fileName);
            },
            margin: [60, 60, 60, 60], // Wide margins
            autoPaging: 'text',
            html2canvas: {
                scale: 0.6, 
                useCORS: true,
                letterRendering: true,
            },
            width: doc.internal.pageSize.getWidth() - 120,
            windowWidth: 1400 // Wider window for landscape
        });
    };

    const handleAcceptClick = () => {
        setIsAccepted(true);
        setIsEditing(false);
    };

    const handleEditClick = () => {
        setIsEditing(true);
    };

    return (
        <div className="w-full mt-8 space-y-6">
             {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
                        <h3 className="text-xl font-bold text-black mb-4">Estamos trabajando para usted...</h3>
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black mb-4"></div>
                        <p className="text-black transition-opacity duration-500">{currentLoadingPhrase}</p>
                    </div>
                </div>
            )}
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="mb-4">Reúne todo tu trabajo en un documento que te ayudará a comenzar tu trabajo.</p>
                <button onClick={() => generateReport(false)} disabled={isLoading || reportContent !== ''}
                    className="w-full max-w-sm mx-auto py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                    {isLoading ? 'Generando Informe...' : 'Generar Informe'}
                </button>
            </div>

            {reportContent && (
                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg animate-fade-in">
                     <style>
                        {`
                        /* Print-specific styles for PDF generation */
                        @media print {
                            body {
                                -webkit-print-color-adjust: exact;
                                print-color-adjust: exact;
                            }
                            .report-container {
                                column-count: 2;
                                column-gap: 30px; /* Medianil */
                                font-size: 9pt;
                            }
                            .gantt-container-for-pdf {
                                page-break-before: always; /* Puts Gantt on a new page */
                                column-count: 1; /* Gantt should not be in columns */
                                width: 100%;
                            }
                            h1, h2, h3, h4 {
                                page-break-after: avoid;
                                page-break-inside: avoid;
                            }
                            table, figure, .gantt-table-container {
                                 page-break-inside: avoid;
                            }
                        }
                        /* Screen styles */
                        .gantt-container-for-pdf {
                            overflow-x: auto;
                            border: 1px solid #eee;
                            padding: 8px;
                            border-radius: 8px;
                        }
                        `}
                    </style>
                    <div 
                        ref={reportRef} 
                        className="report-container prose max-w-none" 
                        style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", textAlign: 'left', color: '#000000' }}
                    >
                        {isEditing ? (
                            <textarea
                                className="w-full h-screen p-2 border border-gray-300 rounded"
                                value={reportContent}
                                onChange={e => setReportContent(e.target.value)}
                            />
                        ) : (
                            <HtmlTypewriter htmlContent={reportContent} speed={5} />
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 mt-8 border-t pt-6">
                        {!isAccepted ? (
                            <>
                                <button onClick={() => generateReport(true)} disabled={isRobustifying || isEditing}
                                    className="flex-1 py-3 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                                    {isRobustifying ? 'Robusteciendo...' : 'Robustecer'}
                                </button>
                                 <button onClick={handleEditClick} disabled={isRobustifying || isEditing}
                                    className="flex-1 py-3 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300 disabled:opacity-50">
                                    Editar
                                </button>
                                <button onClick={handleAcceptClick}
                                    className="flex-1 py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800">
                                    Aceptar informe
                                </button>
                            </>
                        ) : (
                             <button onClick={handleDownload}
                                className="w-full py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800">
                                Descargar PDF
                            </button>
                        )}
                    </div>
                </div>
            )}
             {error && <p className="text-black font-bold mt-4 text-center">{error}</p>}
        </div>
    );
};

export default FinalReport;