import React, { useMemo } from 'react';

interface ModelDetail {
  model: string;
  bestAt: string;
  strengths: string;
  weaknesses: string;
}

interface ModelSpecificationTooltipProps {
  modelName: string;
}


// Tooltip details for models available via Portkey
export const AI_MODEL_DETAILS_LIST: ModelDetail[] = [
  // OpenAI Models
  {
    model: "GPT-4o",
    bestAt: "General purpose, coding, math, complex reasoning",
    strengths: "High accuracy, creative writing, strong instruction following, multimodal support",
    weaknesses: "Higher cost, may be slower under heavy load",
  },
  {
    model: "GPT-4o Mini",
    bestAt: "Fast responses, real-time tasks, chatbots",
    strengths: "Lightweight, fast inference, cost-effective, good for general tasks",
    weaknesses: "Limited reasoning compared to GPT-4o, not ideal for complex analysis",
  },
  // Groq Models
  {
    model: "Llama 3.3 70B",
    bestAt: "Fast inference, custom apps, general chat",
    strengths: "Very fast inference via Groq, open-source, cost-effective, versatile",
    weaknesses: "May require more specific prompting, less polished than commercial models",
  },
  // AWS Bedrock Models
  {
    model: "Claude 3.5 Sonnet",
    bestAt: "Reasoning, analysis, long documents, enterprise workloads",
    strengths: "Safe, coherent, deep reasoning, large context window, excellent instruction following",
    weaknesses: "Higher cost, may be slower than smaller models",
  },
  // OpenRouter Models
  {
    model: "Claude 3.5 Sonnet (OR)",
    bestAt: "Reasoning, analysis, diverse model access",
    strengths: "Access via OpenRouter for broader model selection, strong reasoning",
    weaknesses: "Depends on OpenRouter availability, may have variable latency",
  },
  // Auto-routing
  {
    model: "Auto (Portkey)",
    bestAt: "Intelligent routing based on task type",
    strengths: "Automatic provider selection, cost optimization, failover handling, best balance",
    weaknesses: "Less control over specific model selection",
  },
];


export const ModelSpecificationTooltip: React.FC<ModelSpecificationTooltipProps> = ({ modelName }) => {
  const selectedModelDetail = useMemo(
    () => AI_MODEL_DETAILS_LIST.find((model) => model.model === modelName),
    [modelName],
  );

  return (
    <div className="model-tooltip flex flex-col gap-2" style={{ width: '280px' }}>
      <div className="flex flex-col">
        <div className="truncate text-xs font-medium">
          {selectedModelDetail?.model}
        </div>

        <div 
          className="my-1 opacity-40" 
          style={{ borderBottom: '1px solid var(--card-border)' }}
        />
        
        <div className="flex flex-col gap-2">
          <div className="flex flex-col">
            <div className="truncate text-xs font-medium">
              Best At
            </div>
            <div className="opacity-80 text-xs">
              {selectedModelDetail?.bestAt}
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="truncate text-xs font-medium">
              Strengths
            </div>
            <div className="opacity-80 text-xs">
              {selectedModelDetail?.strengths}
            </div>
          </div>
          
          <div className="flex flex-col">
            <div className="truncate text-xs font-medium">
              Weaknesses
            </div>
            <div className="opacity-80 text-xs">
              {selectedModelDetail?.weaknesses}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};