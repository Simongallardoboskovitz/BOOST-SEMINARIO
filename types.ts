
export interface Profile {
  nombre: string;
  pronombres: string;
  preferencias: string;
}

export interface MethodologyData {
  approach: 'Cualitativo' | 'Cuantitativo' | 'Mixto' | '';
  techniques: string[];
  populationSample: string;
}

export interface Reference {
    name: string;
    author: string;
    source: string;
    description: string;
    relevance: string;
}

export interface WorkPlanTask {
    id: number;
    text: string;
}
