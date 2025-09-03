
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ProfileForm from './components/ProfileForm';
import Navigation from './components/Navigation';
import ThemeExploration from './components/ThemeExploration';
import Carousel from './components/Carousel';
import type { Profile, Reference, WorkPlanTask } from './types';
import DesignOpportunity from './components/DesignOpportunity';
import Page from './components/Page';
import ProgressBar from './components/ProgressBar';
import WarningPopup from './components/WarningPopup';
import DesignPortalsPopup from './components/DesignPortalsPopup';
import DisciplinaryScope from './components/DisciplinaryScope';
import PersonalContribution from './components/PersonalContribution';
import StructuredContentBuilder from './components/StructuredContentBuilder';
import ReferenceAnalysis from './components/ReferenceAnalysis';
import ProjectProposal from './components/ProjectProposal';
import ProjectEvaluation from './components/ProjectEvaluation';
import WorkPlan from './components/WorkPlan';
import FinalReport from './components/FinalReport';
import UserResearch from './components/UserResearch';
import TimeUpPopup from './components/TimeUpPopup';


const App: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<number>(1);
    const totalSteps = 15;
    const [showWarning, setShowWarning] = useState(true);
    const [showDesignPortalsPopup, setShowDesignPortalsPopup] = useState(false);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [aiResponseGenerated, setAiResponseGenerated] = useState<Record<number, boolean>>({});
    
    // Timer state
    const [timerKey, setTimerKey] = useState(0);
    const [timerDuration, setTimerDuration] = useState(180);
    const [showTimeUpPopup, setShowTimeUpPopup] = useState(false);

    // Step 1
    const [profile, setProfile] = useState<Profile | null>(null);
    // Step 2
    const [topic, setTopic] = useState<string>('');
    const [themeExplorationAiResponse, setThemeExplorationAiResponse] = useState<string>('');
    // Step 3
    const [disciplinaryScopeUserInput, setDisciplinaryScopeUserInput] = useState<string>('');
    const [disciplinaryScopeAiResponse, setDisciplinaryScopeAiResponse] = useState<string>('');
    // Step 4
    const [personalContribution, setPersonalContribution] = useState<string>('');
    const [personalContributionAiResponse, setPersonalContributionAiResponse] = useState<string>('');
    // Step 5
    const [projectGapAnalysis, setProjectGapAnalysis] = useState<string>('');
    // Step 6: User Research
    const [userResearchData, setUserResearchData] = useState<{ persona: string; needs:string; behaviors:string; pains:string; qualitativeGuide: string, quantitativeGuide: string; } | null>(null);
    // Step 7: Research Question
    const [researchQuestion, setResearchQuestion] = useState<string>('');
    // Step 8: Hypothesis
    const [hypothesis, setHypothesis] = useState<string>('');
    // Step 9: General Objective
    const [generalObjective, setGeneralObjective] = useState<string>('');
    // Step 10: Specific Objectives
    const [specificObjectives, setSpecificObjectives] = useState<string[]>(['','','']);
    // Step 11: Reference Analysis
    const [referenceAnalysis, setReferenceAnalysis] = useState<{categories: string[], references: Reference[], benchmark: string} | null>(null);
    // Step 12: Project Proposal
    const [projectProposal, setProjectProposal] = useState<string>('');
    // Step 13: Evaluation
    const [projectEvaluation, setProjectEvaluation] = useState<any>(null);
     // Step 14: Work Plan
    const [workPlan, setWorkPlan] = useState<{tasks: WorkPlanTask[], ganttChart: string} | null>(null);

    // Accepted steps tracker
    const [acceptedSteps, setAcceptedSteps] = useState<Record<number, boolean>>({});

    useEffect(() => {
        const storedProfile = localStorage.getItem('perfil');
        if (storedProfile) {
            setProfile(JSON.parse(storedProfile));
            setAcceptedSteps(prev => ({ ...prev, 1: true }));
        }
        if (currentStep === 2 && !localStorage.getItem('hasSeenDesignPortalsPopup')) {
            setShowDesignPortalsPopup(true);
            localStorage.setItem('hasSeenDesignPortalsPopup', 'true');
        }
    }, []);
    
    useEffect(() => {
        // Reset timer and scroll to top when step changes
        setTimerDuration(180);
        setTimerKey(prev => prev + 1);
        window.scrollTo(0, 0);
    }, [currentStep]);

    const handleProfileGenerated = (newProfile: Profile) => {
        setProfile(newProfile);
        localStorage.setItem('perfil', JSON.stringify(newProfile));
        handleAcceptStep(1);
    };
    
    const handleAiResponseComplete = (step: number) => {
        setAiResponseGenerated(prev => ({ ...prev, [step]: true }));
    };

    const handleAcceptStep = (step: number, data?: any) => {
        switch(step) {
            case 1: if (profile) setAcceptedSteps(prev => ({...prev, 1: true})); break;
            case 2: if(topic.trim()) setAcceptedSteps(prev => ({...prev, 2: true})); break;
            case 3: setAcceptedSteps(prev => ({...prev, 3: true})); break;
            case 4: setAcceptedSteps(prev => ({...prev, 4: true})); break;
            case 5: setProjectGapAnalysis(data); setAcceptedSteps(prev => ({...prev, 5: true})); break;
            case 6: setUserResearchData(data); setAcceptedSteps(prev => ({...prev, 6: true})); break;
            case 7: setResearchQuestion(data); setAcceptedSteps(prev => ({...prev, 7: true})); break;
            case 8: setHypothesis(data); setAcceptedSteps(prev => ({...prev, 8: true})); break;
            case 9: setGeneralObjective(data); setAcceptedSteps(prev => ({...prev, 9: true})); break;
            case 10: setSpecificObjectives(data); setAcceptedSteps(prev => ({...prev, 10: true})); break;
            case 11: setReferenceAnalysis(data); setAcceptedSteps(prev => ({...prev, 11: true})); break;
            case 12: setProjectProposal(data); setAcceptedSteps(prev => ({...prev, 12: true})); break;
            case 13: setProjectEvaluation(data); setAcceptedSteps(prev => ({...prev, 13: true})); break;
            case 14: setWorkPlan(data); setAcceptedSteps(prev => ({...prev, 14: true})); break;
        }
    };

    const handleNextStep = () => {
        if (isNextDisabled()) return;
        setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    };

    const handlePrevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const handleTimeUp = () => {
        setShowTimeUpPopup(true);
    };

    const handleExtendTimer = () => {
        setTimerDuration(60);
        setTimerKey(prev => prev + 1);
        setShowTimeUpPopup(false);
    };

    const handleContinueFromPopup = () => {
        setShowTimeUpPopup(false);
        handleNextStep();
    };
    
    const bannerPhrases = [
        "Tu IA, entrenada con lo que te exige tu profesor.",
        "Calendario y normativas universitario integrado.",
        "Investiga con foco, avanza con sentido.",
        "Aprende haciendo, aprende investigando.",
        "Tus fechas clave, siempre presentes.",
        "Fuentes confiables, respuestas precisas.",
        "De la idea al proyecto, con estructura.",
        "Diseña con datos, reflexiona con apoyo."
    ];
    
    const stepTitles: Record<number, {title: string}> = {
        1: { title: "Bienvenida" },
        2: { title: "¿Cuál es tu tema?" },
        3: { title: "¿Cómo se vincula tu tema con el diseño?" },
        4: { title: "¿Cómo Ayudar?" },
        5: { title: "Oportunidad de Diseño" },
        6: { title: "¡Revisa y corrige el prompt de resumen!" },
        7: { title: "Pregunta de investigación" },
        8: { title: "Hipótesis" },
        9: { title: "Objetivo General" },
        10: { title: "Objetivos Específicos" },
        11: { title: "Análisis de Referentes" },
        12: { title: "Proyecto" },
        13: { title: "Evaluación" },
        14: { title: "Plan de Trabajo" },
        15: { title: "Informe Final" },
    };

    const getStepSubtitle = (step: number): string => {
        const baseSubtitles: Record<number, string> = {
            1: "Comencemos por conocerte un poco mejor.",
            2: "¿Qué te apasiona? ¿Qué te hace olvidar el tiempo y estar horas en algo? ¿Qué amas? ¿Qué aprecias? ¿Qué cuidas? ¿A qué tema quieres contribuir?",
            3: "¿Qué ámbito del diseño está relacionado con tu tema? (Ej: diseño de servicios, diseño especulativo, diseño industrial, diseño urbano, etc.)",
            4: "Pensemos en cómo tu proyecto o enfoque puede contribuir a resolver el problema detectado. Desde tu perspectiva, ¿cómo podrías aportar desde el diseño?",
            5: "Identifiquemos las oportunidades de diseño. ¿Dónde crees que existen brechas que podrían ser cubiertas desde el diseño? Piensa en vacíos, necesidades no resueltas o tensiones visibles en tu tema.",
            6: "El texto a continuación es un resumen generado por IA de todo lo que has trabajado. Puedes editarlo antes de continuar.",
            7: "Formula la pregunta central que guiará todo tu proyecto.",
            8: "Define tu suposición inicial. ¿Qué esperas que suceda como resultado de tu proyecto?",
            9: "Establece la meta principal y más amplia de tu investigación.",
            10: "Desglosa tu objetivo general en metas más pequeñas y manejables.",
            11: "Busca y analiza proyectos y teorías que inspiren y fundamenten tu trabajo.",
            12: "Es hora de articular una propuesta de valor clara y definir tu proyecto.",
            13: "Usemos una rúbrica oficial para evaluar la fortaleza de tu proyecto e identificar mejoras.",
            14: "Organicemos las tareas clave en un cronograma realista para el próximo semestre.",
            15: "Reúne todo tu trabajo en un documento final, listo para ser presentado y descargado.",
        };

        switch (step) {
            case 3:
                if (topic) return `Pensando en tu interés por "${topic}", ¿desde qué ámbito del diseño crees que podrías abordarlo mejor?`;
                break;
            case 4:
                if (disciplinaryScopeUserInput) return `A partir de tu reflexión sobre la conexión del diseño con tu tema, pensemos: ¿cómo podrías aportar para generar impacto?`;
                break;
            case 5:
                 if (topic) return `Considerando tu tema "${topic}", ¿dónde crees que existen brechas o necesidades no resueltas que podrían ser cubiertas desde el diseño?`;
                break;
            case 6:
                if (projectGapAnalysis) return `A partir de la oportunidad de diseño que identificaste, revisemos el panorama completo de tu proyecto para definir a quién entrevistar.`;
                break;
            case 7:
                if (userResearchData?.persona) return `A partir del perfil de usuario que has definido, formulemos ahora la pregunta de investigación central.`;
                break;
            case 8:
                if (researchQuestion) return `Con la pregunta de investigación ya definida, ¿cuál es tu predicción? Define tu suposición inicial sobre los resultados de tu proyecto.`;
                break;
            case 9:
                if (researchQuestion) return `Con tu pregunta de investigación como guía, establece ahora la meta principal y más amplia de tu proyecto.`;
                break;
            case 10:
                 if (generalObjective) return `Para lograr tu objetivo general, desglosemos ahora el plan en metas más pequeñas y manejables.`;
                 break;
            case 11:
                if (specificObjectives.some(o => o.trim() !== '')) return `Con tus objetivos específicos en mente, busca y analiza proyectos y teorías que inspiren y fundamenten tu trabajo.`;
                break;
            case 12:
                if (referenceAnalysis && referenceAnalysis.references.length > 0) return `Inspirado por los referentes que has analizado, es hora de articular una propuesta de valor clara y definir tu proyecto.`;
                break;
        }
        return baseSubtitles[step] || '';
    };


    const isNextDisabled = () => {
        if (isAiTyping) return true;
        if (currentStep === totalSteps) return true;
        
        switch(currentStep) {
            case 1: return !profile;
            case 2: return !topic.trim() || !aiResponseGenerated[2];
            case 3: return !acceptedSteps[3];
            case 4: return !acceptedSteps[4];
            case 5: return !acceptedSteps[5];
            case 6: return !acceptedSteps[6];
            case 7: return !acceptedSteps[7];
            case 8: return !acceptedSteps[8];
            case 9: return !acceptedSteps[9];
            case 10: return !acceptedSteps[10];
            case 11: return !acceptedSteps[11];
            case 12: return !acceptedSteps[12];
            case 13: return !acceptedSteps[13];
            case 14: return !acceptedSteps[14];
            default: return !acceptedSteps[currentStep];
        }
    }
    
    const allData = {
        profile, topic, themeExplorationAiResponse, disciplinaryScopeUserInput, disciplinaryScopeAiResponse, personalContribution, personalContributionAiResponse,
        projectGapAnalysis, userResearchData, researchQuestion, hypothesis, generalObjective, specificObjectives,
        referenceAnalysis, projectProposal, projectEvaluation, workPlan
    };

    return (
        <div className="min-h-screen text-black bg-[#f5f5f5] pb-28">
            {showWarning && <WarningPopup onComplete={() => setShowWarning(false)} />}
            {showDesignPortalsPopup && <DesignPortalsPopup onComplete={() => setShowDesignPortalsPopup(false)} />}
            {showTimeUpPopup && <TimeUpPopup onExtend={handleExtendTimer} onContinue={handleContinueFromPopup} />}
            
            <Header 
                title="Boost Seminario" 
                showTimebox={currentStep >= 2} 
                timerKey={timerKey}
                timerDuration={timerDuration}
                onTimeUp={handleTimeUp}
            />
            
            <main className="p-4 sm:p-6">
                <ProgressBar totalSteps={totalSteps} currentStep={currentStep} />
                
                {currentStep > 1 && (
                    <Page title={stepTitles[currentStep]?.title} subtitle={getStepSubtitle(currentStep)} />
                )}

                <div className="max-w-4xl mx-auto">
                    <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
                        <Carousel items={bannerPhrases} />
                        <ProfileForm 
                            onProfileGenerated={handleProfileGenerated} 
                            setIsAiTyping={setIsAiTyping}
                        />
                    </div>

                    <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
                             <ThemeExploration 
                                profile={profile} 
                                topic={topic} 
                                onTopicChange={setTopic}
                                aiResponse={themeExplorationAiResponse}
                                onAiResponseChange={setThemeExplorationAiResponse}
                                setIsAiTyping={setIsAiTyping}
                                onAiResponseComplete={() => { handleAiResponseComplete(2); handleAcceptStep(2); }}
                             />
                    </div>
                    
                    <div style={{ display: currentStep === 3 ? 'block' : 'none' }}>
                            <DisciplinaryScope
                                profile={profile}
                                topic={topic}
                                themeExplorationAiResponse={themeExplorationAiResponse}
                                userInput={disciplinaryScopeUserInput}
                                onUserInputChange={setDisciplinaryScopeUserInput}
                                aiResponse={disciplinaryScopeAiResponse}
                                onAiResponseChange={setDisciplinaryScopeAiResponse}
                                setIsAiTyping={setIsAiTyping}
                                onAiResponseComplete={() => handleAiResponseComplete(3)}
                                onAccept={() => handleAcceptStep(3)}
                            />
                    </div>

                    <div style={{ display: currentStep === 4 ? 'block' : 'none' }}>
                            <PersonalContribution
                                contribution={personalContribution}
                                onContributionChange={setPersonalContribution}
                                aiResponse={personalContributionAiResponse}
                                onAiResponseChange={setPersonalContributionAiResponse}
                                profile={profile}
                                topic={topic}
                                themeExplorationAiResponse={themeExplorationAiResponse}
                                disciplinaryScopeAiResponse={disciplinaryScopeAiResponse}
                                setIsAiTyping={setIsAiTyping}
                                onAiResponseComplete={() => handleAiResponseComplete(4)}
                                onAccept={() => handleAcceptStep(4)}
                            />
                    </div>

                    <div style={{ display: currentStep === 5 ? 'block' : 'none' }}>
                            <DesignOpportunity
                                allData={allData}
                                profile={profile}
                                setIsAiTyping={setIsAiTyping}
                                onAccept={(data) => {
                                    handleAcceptStep(5, data);
                                }}
                            />
                    </div>

                    <div style={{ display: currentStep === 6 ? 'block' : 'none' }}>
                        <UserResearch
                            onAccept={(data) => handleAcceptStep(6, data)}
                            profile={profile}
                            allData={allData}
                            setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    <div style={{ display: currentStep === 7 ? 'block' : 'none' }}>
                        <StructuredContentBuilder
                            step={7}
                            title="Pregunta de investigación"
                            pedagogicalText="✏️ Una buena pregunta de investigación es clara, enfocada y argumentable. Usa la fórmula: ¿Cómo puede [un proyecto o intervención] mejorar [un aspecto específico] para [un usuario o comunidad] en [un contexto]?"
                            structureFields={[
                                { key: 'intervention', label: 'Proyecto o Intervención', placeholder: 'Ej: Un sistema de señalética phygital' },
                                { key: 'aspect', label: 'Aspecto a Mejorar', placeholder: 'Ej: La experiencia de descubrimiento cultural' },
                                { key: 'user', label: 'Usuario o Comunidad', placeholder: 'Ej: Los habitantes de Valparaíso' },
                                { key: 'context', label: 'Contexto', placeholder: 'Ej: En sus recorridos diarios por la ciudad' }
                            ]}
                            compositionTemplate={(data) => `¿Cómo puede ${data.intervention || '[un proyecto]'} mejorar ${data.aspect || '[un aspecto]'} para ${data.user || '[un usuario]'} en ${data.context || '[un contexto]'}?`}
                            onAccept={(data) => handleAcceptStep(7, data)}
                            profile={profile}
                            allData={allData}
                             setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                     <div style={{ display: currentStep === 8 ? 'block' : 'none' }}>
                        <StructuredContentBuilder
                            step={8}
                            title="Hipótesis"
                            pedagogicalText="✏️ Una hipótesis es tu predicción. Se estructura así: Si [se implementa una acción o solución], entonces [se observará un resultado medible] debido a [una razón o mecanismo]."
                            structureFields={[
                                { key: 'action', label: 'Acción o Solución Propuesta', placeholder: 'Ej: Se implementa un sistema de narrativas urbanas interactivas' },
                                { key: 'result', label: 'Resultado Esperado', placeholder: 'Ej: Aumentará el involucramiento de los jóvenes con el patrimonio local' },
                                { key: 'reason', label: 'Razón o Mecanismo', placeholder: 'Ej: La gamificación y el storytelling generan una conexión emocional más fuerte' }
                            ]}
                            compositionTemplate={(data) => `Si ${data.action || '[se implementa una acción]'}, entonces ${data.result || '[se observará un resultado]'} debido a ${data.reason || '[una razón]'}.`}
                            onAccept={(data) => handleAcceptStep(8, data)}
                            profile={profile}
                            allData={allData}
                             setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    <div style={{ display: currentStep === 9 ? 'block' : 'none' }}>
                        <StructuredContentBuilder
                            step={9}
                            title="Objetivo General"
                            pedagogicalText="✏️ El objetivo general es la meta principal, el gran 'qué' de tu proyecto. Inicia con un verbo en infinitivo y declara el propósito final. Fórmula: [Verbo en infinitivo] [qué se hará] para [lograr qué finalidad]."
                            structureFields={[
                                { key: 'verb', label: 'Verbo en Infinitivo', placeholder: 'Contribuir' },
                                { key: 'what', label: 'Qué se Hará', placeholder: 'Ej: Una plataforma interactiva que conecta a artesanos locales con diseñadores emergentes' },
                                { key: 'purpose', label: 'Finalidad', placeholder: 'Ej: Fomentar la co-creación y la economía circular en el sector creativo' }
                            ]}
                            compositionTemplate={(data) => `${data.verb || '[Verbo]'} ${data.what || '[qué se hará]'} para ${data.purpose || '[lograr qué finalidad]'}.`}
                            onAccept={(data) => handleAcceptStep(9, data)}
                            profile={profile}
                            allData={allData}
                             setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    <div style={{ display: currentStep === 10 ? 'block' : 'none' }}>
                        <StructuredContentBuilder
                            step={10}
                            title="Objetivos Específicos"
                            pedagogicalText="✏️ Los objetivos específicos son los pasos concretos para alcanzar el objetivo general. Redacta 3. Cada uno debe ser un 'mini-objetivo' claro y medible."
                            objectives={specificObjectives}
                            onObjectivesChange={setSpecificObjectives}
                            onAccept={(data) => handleAcceptStep(10, data)}
                            profile={profile}
                            allData={allData}
                            setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    
                    <div style={{ display: currentStep === 11 ? 'block' : 'none' }}>
                        <ReferenceAnalysis 
                            onAccept={(data) => handleAcceptStep(11, data)}
                            profile={profile}
                            allData={allData}
                            setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    
                    <div style={{ display: currentStep === 12 ? 'block' : 'none' }}>
                       <ProjectProposal
                            onAccept={(data) => handleAcceptStep(12, data)}
                            profile={profile}
                            allData={allData}
                            setIsAiTyping={setIsAiTyping}
                       />
                    </div>
                    
                    <div style={{ display: currentStep === 13 ? 'block' : 'none' }}>
                        <ProjectEvaluation
                            onAccept={(data) => handleAcceptStep(13, data)}
                            profile={profile}
                            allData={allData}
                            setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    
                    <div style={{ display: currentStep === 14 ? 'block' : 'none' }}>
                        <WorkPlan
                             onAccept={(data) => handleAcceptStep(14, data)}
                             profile={profile}
                             allData={allData}
                             setIsAiTyping={setIsAiTyping}
                        />
                    </div>
                    
                    <div style={{ display: currentStep === 15 ? 'block' : 'none' }}>
                        <FinalReport
                            allData={allData}
                            onAccept={() => setAcceptedSteps(prev => ({...prev, 15: true}))}
                        />
                    </div>
                </div>


            </main>
            <Navigation
                onNext={handleNextStep}
                onPrev={handlePrevStep}
                isPrevDisabled={currentStep === 1}
                isNextDisabled={isNextDisabled()}
            />
        </div>
    );
};

export default App;