import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';

interface DesignOpportunityProps {
    onAccept: (data: string) => void;
    profile: Profile | null;
    allData: any;
    setIsAiTyping: (isTyping: boolean) => void;
}

// Simplified state machine
type ViewState = 'initial' | 'variants_loading' | 'variants_displayed' | 'variant_developing' | 'variant_developed' | 'accepted';

const DesignOpportunity: React.FC<DesignOpportunityProps> = ({ onAccept, profile, allData, setIsAiTyping }) => {
    const [view, setView] = useState<ViewState>('initial');
    const [error, setError] = useState('');

    const [gapInput, setGapInput] = useState('');
    const [conceptualVariants, setConceptualVariants] = useState<string[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<string>('');
    const [developedVariantText, setDevelopedVariantText] = useState('');
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [animatingIndex, setAnimatingIndex] = useState(0);


    const handleGenerateVariants = async () => {
        if (!gapInput.trim()) {
            setError('Por favor, describe una brecha u oportunidad para continuar.');
            return;
        }
        setError('');
        setIsAiTyping(true);
        setView('variants_loading');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un estratega de diseño y mentor académico para ${profile?.nombre || 'un estudiante'}.
Contexto del proyecto:
- Tema: ${allData.topic}
- Exploración: ${allData.themeExplorationAiResponse}
- Ámbito de diseño: ${allData.disciplinaryScopeAiResponse}
- Contribución personal: ${allData.personalContribution}

El estudiante ha identificado la siguiente brecha u oportunidad de diseño:
"${gapInput}"

TAREA: Conecta esta brecha con el contexto previo y genera exactamente TRES variantes conceptuales para abordarla desde el diseño. Cada variante debe proponer un enfoque o marco de intervención distinto y no superar las 140 palabras.
Separa las tres variantes con el delimitador exacto: <!-- VARIANT -->
No incluyas títulos ni numeración.`;

            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            const variants = response.text.split('<!-- VARIANT -->').map(v => v.trim()).filter(Boolean);
            if (variants.length < 2) throw new Error("La IA no generó las variantes esperadas.");
            setConceptualVariants(variants);
            setView('variants_displayed');
        } catch (err: any) {
            console.error(err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('No se pudieron generar las variantes conceptuales. Intenta de nuevo.');
            }
            setView('initial');
        } finally {
            setIsAiTyping(false);
        }
    };

    useEffect(() => {
        if (view === 'variants_displayed') {
            setAnimatingIndex(0);
        }
    }, [view]);
    
    const handleSelectVariant = async (variant: string) => {
        setSelectedVariant(variant);
        setIsAiTyping(true);
        setView('variant_developing');
        setIsAnimating(true);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un teórico del diseño. Has seleccionado la siguiente variante conceptual para un proyecto sobre "${allData.topic}":
Variante: "${variant}"

TAREA: Desarrolla esta variante en un párrafo. Profundiza en su sentido, su alcance potencial y cómo se relaciona con el caso del estudiante. Usa HTML simple (<p>, <strong>).`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setDevelopedVariantText(response.text);
            setView('variant_developed');
        } catch(err: any) {
            console.error(err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('No se pudo desarrollar la variante. Inténtalo de nuevo.');
            }
            setView('variants_displayed');
        } finally {
            setIsAiTyping(false);
            // isAnimating will be set to false by HtmlTypewriter's onComplete
        }
    };
        
    const handleIterateVariant = async () => {
        setIsAiTyping(true);
        setError('');
        setView('variant_developing');
        setIsAnimating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Actúa como un editor académico. Toma la siguiente reflexión sobre un concepto de diseño y ofrécele una nueva formulación o un enfoque ligeramente distinto, manteniendo la intención original.
Reflexión original: "${developedVariantText}"
Nueva formulación (Usa HTML simple):`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setDevelopedVariantText(response.text);
            setView('variant_developed');
        } catch (err: any) {
            console.error(err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Límite de solicitudes alcanzado. Por favor, espera un momento y vuelve a intentarlo.');
            } else {
                setError('Error al iterar. Intenta de nuevo.');
            }
            setView('variant_developed');
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleEdit = () => {
        setEditedText(developedVariantText);
        setIsEditing(true);
    };

    const handleSaveEdit = () => {
        setDevelopedVariantText(editedText);
        setIsEditing(false);
    };

    const handleAccept = () => {
        onAccept(isEditing ? editedText : developedVariantText);
        setView('accepted');
    };

    const isLoading = ['variants_loading', 'variant_developing'].includes(view);

    const renderLoading = (text: string) => (
        <div className="mt-6 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p className="text-black mt-2">{text}</p>
        </div>
    );
    
    return (
        <div className="w-full mt-8 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                {view === 'initial' && (
                    <>
                        <p className="mb-4 text-black">¿Dónde crees que existen brechas que podrían ser cubiertas desde el diseño? Piensa en vacíos, necesidades no resueltas o tensiones visibles en tu tema.</p>
                        <textarea
                            id="gapInput"
                            value={gapInput}
                            onChange={(e) => setGapInput(e.target.value)}
                            placeholder="Escribe aquí una brecha u oportunidad detectada..."
                            className="w-full h-24 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:outline-none"
                            aria-label="Oportunidad de diseño"
                        />
                        <button onClick={handleGenerateVariants} disabled={!gapInput.trim() || isLoading} className="w-full mt-4 py-3 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">
                            Robustecer concepto
                        </button>
                    </>
                )}
                {view === 'variants_loading' && renderLoading('Generando variantes...')}
                {view === 'variants_displayed' && (
                    <div className="animate-fade-in">
                        <h3 className="font-bold text-lg mb-4">Elige una variante conceptual para abordar la brecha:</h3>
                        <div className="space-y-3">
                            {conceptualVariants.map((variant, index) => (
                                <button key={index} onClick={() => handleSelectVariant(variant)}
                                    className="w-full text-left p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 hover:border-black transition">
                                    {index <= animatingIndex ? (
                                        <HtmlTypewriter
                                            htmlContent={variant}
                                            onComplete={() => {
                                                if (index === animatingIndex) {
                                                    setAnimatingIndex(prev => prev + 1);
                                                }
                                            }}
                                        />
                                    ) : (
                                        <div className="h-12">&nbsp;</div> // Placeholder for smooth appearance
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {(view === 'variant_developing' || view === 'variant_developed' || view === 'accepted') && (
                <div className="bg-white p-6 rounded-xl shadow-lg animate-fade-in">
                    {view === 'variant_developing' && renderLoading('Desarrollando variante...')}
                    
                    {view === 'variant_developed' && (
                        <>
                            {isEditing ? (
                                <div>
                                    <textarea value={editedText} onChange={(e) => setEditedText(e.target.value)} className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black" aria-label="Editar desarrollo de variante"/>
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={() => setIsEditing(false)} className="py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold">Cancelar</button>
                                        <button onClick={handleSaveEdit} className="py-2 px-4 rounded-lg bg-black text-white font-semibold">Guardar</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <HtmlTypewriter
                                        htmlContent={developedVariantText}
                                        className="prose max-w-none text-black"
                                        onComplete={() => setIsAnimating(false)}
                                    />
                                    <div className="flex flex-col sm:flex-row gap-2 mt-4 border-t pt-4">
                                        <button onClick={handleEdit} disabled={isLoading || isAnimating} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">Editar</button>
                                        <button onClick={handleIterateVariant} disabled={isLoading || isAnimating} className="flex-1 py-2 px-4 rounded-lg bg-gray-200 text-black font-semibold hover:bg-gray-300 disabled:opacity-50">Robustecer</button>
                                        <button onClick={handleAccept} disabled={isLoading || isAnimating} className="flex-1 py-2 px-4 rounded-lg bg-black text-white font-semibold hover:bg-gray-800 disabled:opacity-50">Aceptar Versión</button>
                                    </div>
                                </>
                            )}
                        </>
                    )}
                    
                    {view === 'accepted' && (
                        <div className="border-2 border-black p-4 rounded-lg bg-gray-100">
                             <h3 className="font-bold text-lg mb-2 text-black">✓ Aceptado:</h3>
                            <div className="prose max-w-none text-black" dangerouslySetInnerHTML={{ __html: developedVariantText }}></div>
                        </div>
                    )}
                 </div>
            )}
            {error && <p className="text-black font-bold mt-2 text-center">{error}</p>}
        </div>
    );
};

export default DesignOpportunity;