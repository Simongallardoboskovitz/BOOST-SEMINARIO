import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import type { Profile, Reference } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface ReferenceAnalysisProps {
    onAccept: (data: { categories: string[], references: Reference[], benchmark: string }) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

const ReferenceAnalysis: React.FC<ReferenceAnalysisProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [categories, setCategories] = useState<string[]>(['', '', '']);
    const [results, setResults] = useState<Record<string, Reference[]>>({});
    const [benchmark, setBenchmark] = useState<string>('');
    
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [error, setError] = useState('');
    const [view, setView] = useState<'initial' | 'results' | 'benchmark'>('initial');
    const [isEditingBenchmark, setIsEditingBenchmark] = useState(false);
    const [editedBenchmark, setEditedBenchmark] = useState('');

    const handleCategoryChange = (index: number, value: string) => {
        const newCategories = [...categories];
        newCategories[index] = value;
        setCategories(newCategories);
    };

    const handleSearch = async (category: string, index: number) => {
        if (!category.trim()) return;
        setIsLoading(prev => ({ ...prev, [index]: true }));
        setIsAiTyping(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un bibliotecario de investigación experto. Para la categoría "${category}" dentro de un proyecto sobre "${allData.topic}", encuentra exactamente dos referentes (proyectos, autores, teorías).

Devuelve la respuesta en formato JSON.
Prioriza fuentes como MIT Press Open, Dezeen, Core77, Behance, ArchDaily, Designboom, e Interaction Design Foundation.`;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                     responseMimeType: "application/json",
                     responseSchema: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            name: { type: Type.STRING },
                            author: { type: Type.STRING },
                            source: { type: Type.STRING },
                            description: { type: Type.STRING, description: 'Máximo 300 caracteres' },
                            relevance: { type: Type.STRING },
                          },
                          required: ['name', 'author', 'source', 'description', 'relevance']
                        },
                     }
                }
            });
            
            const jsonResponse = JSON.parse(response.text);
            setResults(prev => ({ ...prev, [category]: jsonResponse }));
            if (view === 'initial') setView('results');

        } catch (err: any) {
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                 setError(`Límite de solicitudes alcanzado para "${category}". Espera un momento.`);
            } else {
                setError(`Error buscando para "${category}"`);
            }
            console.error(err);
        } finally {
            setIsLoading(prev => ({ ...prev, [index]: false }));
            setIsAiTyping(false);
        }
    };
    
    const handleGenerateBenchmark = async (isIteration = false) => {
        setIsLoading(prev => ({ ...prev, benchmark: true }));
        setIsAiTyping(true);
        if(!isIteration) setBenchmark('');
        setError('');
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un analista estratégico de diseño. Has recopilado los siguientes referentes: ${JSON.stringify(results)}.
Analiza el conjunto de referentes en relación al proyecto del estudiante sobre "${allData.topic}".

${isIteration ? 'TAREA (Iteración): Itera sobre el análisis anterior, ofreciendo una nueva perspectiva o profundizando en una de las brechas identificadas.' : `TAREA: Genera un análisis completo con la siguiente estructura y formato HTML:
1.  **Párrafo Introductorio:** Comienza con un párrafo que explique brevemente las dimensiones de análisis que usarás (ej. conceptual, técnico, estético).
2.  **Tabla Comparativa:** Crea una tabla HTML (<table>) que compare los referentes en aspectos clave. La tabla debe ser responsive y tener scroll horizontal si es necesario.
3.  **Texto Analítico:** Después de la tabla, escribe un texto interpretativo que sintetice los hallazgos, destacando patrones, similitudes y diferencias relevantes para el proyecto del estudiante. Enfatiza los elementos clave con <strong>.
4.  **Brechas Identificadas:** Concluye con un listado de las brechas de oportunidad que este análisis revela. Usa una lista HTML (<ul>) y pon cada brecha en negrita (<strong>).`}

Usa HTML simple. Todo el texto, incluyendo el de la tabla, debe ser de color negro. No uses colores de fondo ni estilos complejos.`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setBenchmark(response.text);
            setView('benchmark');
        } catch (err: any) {
             if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError(`Límite de solicitudes alcanzado. No se pudo generar el análisis.`);
            } else {
                setError(`Error generando el análisis.`);
            }
             console.error(err);
        } finally {
             setIsLoading(prev => ({ ...prev, benchmark: false }));
             setIsAiTyping(false);
        }
    };

    const handleEditBenchmark = () => {
        setEditedBenchmark(benchmark);
        setIsEditingBenchmark(true);
    };

    const handleSaveBenchmark = () => {
        setBenchmark(editedBenchmark);
        setIsEditingBenchmark(false);
    };

    const handleAcceptAndFinish = () => {
        const allReferences = Object.values(results).flat();
        onAccept({ categories, references: allReferences, benchmark });
    };

    const canGenerateBenchmark = categories.filter(c => c.trim()).every(c => results[c] && results[c].length > 0);

    return (
        <div className="w-full mt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <p className="mb-4">Define tres categorías clave de referentes para tu proyecto (constructivas, conceptuales, formales, gestión, tecnológicas, etc.).</p>
                <div className="space-y-3">
                    {categories.map((cat, index) => (
                        <div key={index} className="flex gap-2">
                            <input type="text" value={cat} onChange={e => handleCategoryChange(index, e.target.value)}
                                placeholder={
                                    index === 0 ? 'Categoría 1 (ej. proyectos de datos abiertos)' :
                                    index === 1 ? 'Categoría 2 (ej. plataformas de co-creación ciudadana)' :
                                    'Categoría 3 (ej. visualizaciones de datos especulativas)'
                                }
                                className="flex-grow p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"/>
                            <button onClick={() => handleSearch(cat, index)} disabled={!cat || isLoading[index]}
                                className="py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                                {isLoading[index] ? 'Buscando...' : '🔎'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {view === 'results' && Object.keys(results).length > 0 && (
                <div className="space-y-6 animate-fade-in">
                    {categories.filter(c => results[c]).map((cat, catIndex) => (
                        <div key={catIndex} className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="font-bold text-xl mb-4">Resultados para: "{cat}"</h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {results[cat]?.map((ref, refIndex) => (
                                    <div key={refIndex} className="p-4 border rounded-lg bg-gray-50">
                                        <h4 className="font-bold">{ref.name}</h4>
                                        <p className="text-sm text-gray-600 italic">{ref.author}</p>
                                        <p className="my-2 text-sm">{ref.description}</p>
                                        <p className="my-2 text-sm"><strong>Relevancia:</strong> {ref.relevance}</p>
                                        <a href={ref.source} target="_blank" rel="noopener noreferrer" className="text-black underline hover:font-bold text-sm">Fuente</a>
                                    </div>
                                ))}
                            </div>
                             <div className="flex gap-2 mt-4">
                                <button onClick={() => handleSearch(cat, catIndex)} disabled={isLoading[catIndex]}
                                    className="py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300">🔁 Buscar nuevos</button>
                            </div>
                        </div>
                    ))}
                     {canGenerateBenchmark && (
                         <div className="text-center bg-white p-6 rounded-xl shadow-lg">
                             <button onClick={() => handleGenerateBenchmark(false)} disabled={isLoading['benchmark']}
                                className="py-3 px-6 rounded-lg bg-black text-white font-bold hover:bg-gray-800 disabled:opacity-50">
                                {isLoading['benchmark'] ? 'Analizando...' : '📊 Benchmark y brechas'}
                                </button>
                         </div>
                    )}
                </div>
            )}
            
            {view === 'benchmark' && benchmark && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    <h3 className="font-bold text-xl mb-4 text-black">Benchmark y Brechas</h3>
                    {isEditingBenchmark ? (
                        <div>
                             <textarea 
                                value={editedBenchmark}
                                onChange={(e) => setEditedBenchmark(e.target.value)}
                                className="w-full h-96 p-2 border rounded"
                            />
                            <div className="flex justify-end gap-2 mt-2">
                                <button onClick={() => setIsEditingBenchmark(false)} className="py-2 px-4 rounded-lg bg-gray-300">Cancelar</button>
                                <button onClick={handleSaveBenchmark} className="py-2 px-4 rounded-lg bg-black text-white">Guardar</button>
                            </div>
                        </div>
                    ) : (
                         <div>
                            <div className="overflow-x-auto benchmark-table">
                                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: benchmark }} />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 mt-6 border-t pt-4">
                                <button onClick={handleEditBenchmark} disabled={isLoading['benchmark']} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300">Editar</button>
                                <button onClick={() => handleGenerateBenchmark(true)} disabled={isLoading['benchmark']} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 font-semibold hover:bg-gray-300">Iterar</button>
                                <button onClick={handleAcceptAndFinish} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-bold">Aceptar</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};

export default ReferenceAnalysis;