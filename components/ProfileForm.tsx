import React, { useState, useRef, useEffect } from 'react';
import type { Profile } from '../types';
import HtmlTypewriter from './HtmlTypewriter';
import { GoogleGenAI } from '@google/genai';

interface ProfileFormProps {
    onProfileGenerated: (profile: Profile) => void;
    setIsAiTyping: (isTyping: boolean) => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onProfileGenerated, setIsAiTyping }) => {
    const [name, setName] = useState<string>('');
    const [pronoun, setPronoun] = useState<string>('');
    const [preference, setPreference] = useState<string>('');
    const [showProfileText, setShowProfileText] = useState(false);
    const [aiWelcomeMessage, setAiWelcomeMessage] = useState('');
    const [error, setError] = useState('');
    
    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !pronoun) {
            alert('Por favor, completa tu nombre y pronombres para continuar.');
            return;
        }
        
        onProfileGenerated({ nombre: name, pronombres: pronoun, preferencias: preference });
        setShowProfileText(true);
        setIsAiTyping(true);
        setError('');
        setAiWelcomeMessage('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `
Actúa como 'Ágora', un guía de diseño que utiliza el método socrático (mayéutico). Eres una IA diseñada para dialogar y ayudar a los usuarios a 'dar a luz' sus propias ideas, no para darles respuestas directas. Tu tono es el de un compañero de viaje, un par reflexivo y sereno.

Un estudiante llamado ${name} (pronombres: ${pronoun}) acaba de iniciar un proceso para desarrollar su proyecto de título. Sus preferencias de aprendizaje son: "${preference || 'aprender haciendo'}".

**Tarea:** Escribe un mensaje de bienvenida personalizado y breve para ${name}.
**Instrucciones:**
1. Salúdalo por su nombre de forma cálida.
2. Preséntate como 'Ágora'.
3. Explica tu propósito usando la metáfora mayéutica: no estás aquí para enseñar, sino para ayudarle a descubrir el conocimiento que ya posee, a través de preguntas y diálogo.
4. Invítalo a este viaje de descubrimiento conjunto, estableciendo una relación de pares.
5. El tono debe ser inspirador, cercano y filosófico, pero claro y accesible.
6. Finaliza el mensaje con la pregunta exacta: '¿Qué tema te parece inquietante?'
7. Formato: Usa HTML simple, como <p>, <strong> y <em>.
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAiWelcomeMessage(response.text);

        } catch (err: any) {
            console.error("Error generating welcome message:", err);
            if (err.toString().includes('429') || err.toString().includes('RESOURCE_EXHAUSTED')) {
                setError('Se ha superado el límite de solicitudes a la IA. Por favor, espera un momento. Usaremos un mensaje estándar para continuar.');
            } else {
                setError("No se pudo generar la bienvenida. Usaremos un mensaje estándar.");
            }
            // Fallback message
            setAiWelcomeMessage(`<p>¡Hola, <strong>${name}</strong>! Te doy la bienvenida a este viaje. Soy <strong>Ágora</strong>, tu guía en este proceso. Mi propósito no es darte respuestas, sino ayudarte a descubrir las ideas que ya posees a través del diálogo. Juntos daremos forma a tu proyecto.</p><p>¿Qué tema te parece inquietante?</p>`);
        }
    };
    
    const inputStyle = "w-full p-3 bg-white border border-white rounded-lg focus:ring-2 focus:ring-black focus:outline-none text-black font-normal placeholder-gray-600";

    return (
        <div className="max-w-4xl mx-auto bg-white p-6 sm:p-8 rounded-xl shadow-lg">
            <form onSubmit={handleFormSubmit}>
                <div className="mb-5">
                    <label htmlFor="nombre" className="block mb-2 text-sm font-bold text-gray-800">
                        ¿Cómo quieres que te llame?
                    </label>
                     <input
                        type="text"
                        id="nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre o apodo"
                        className={inputStyle}
                        required
                    />
                </div>
                <div className="mb-5">
                    <label htmlFor="pronombres" className="block mb-2 text-sm font-bold text-gray-800">
                        ¿Con qué pronombres quieres que te hable?
                    </label>
                    <select
                        id="pronombres"
                        value={pronoun}
                        onChange={(e) => setPronoun(e.target.value)}
                        className={`${inputStyle} ${pronoun ? 'text-black font-normal' : 'text-gray-500'}`}
                        required
                    >
                        <option value="" disabled className="font-normal text-gray-500">Elige tus pronombres</option>
                        <option className="font-normal text-black">Él</option>
                        <option className="font-normal text-black">Ella</option>
                        <option className="font-normal text-black">Elle</option>
                        <option className="font-normal text-black">Otro</option>
                    </select>
                </div>
                <div className="mb-6">
                    <label htmlFor="preferencias" className="block mb-2 text-sm font-bold text-gray-800">
                        ¿Cómo aprendes mejor?
                    </label>
                    <input
                        type="text"
                        id="preferencias"
                        value={preference}
                        onChange={(e) => setPreference(e.target.value)}
                        placeholder="Ej: con ejemplos, paso a paso..."
                         className={inputStyle}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-3 px-4 border-none rounded-lg bg-black text-white text-base font-semibold cursor-pointer hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-colors"
                >
                    Generar Perfil y Continuar
                </button>
            </form>
            {showProfileText && (
                 <div className="mt-6 border-t pt-6">
                    {aiWelcomeMessage ? (
                         <HtmlTypewriter
                            htmlContent={aiWelcomeMessage}
                            className="prose prose-lg max-w-none text-gray-800 font-normal prose-strong:font-bold"
                            onComplete={() => {
                                setIsAiTyping(false);
                            }}
                          />
                    ) : (
                        <div className="text-center">
                           <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                           <p className="text-black mt-2">Personalizando tu bienvenida...</p>
                       </div>
                    )}
                     {error && <p className="text-black font-bold text-sm mt-2">{error}</p>}
                </div>
            )}
        </div>
    );
};

export default ProfileForm;