"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Shield, 
  Building, 
  Gavel, 
  Server, 
  Home,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useContractReviewStore, ContractTemplate } from '@/store/contractReview';

const getTemplateIcon = (type: string) => {
  // Colorful circular icon per type
  const base = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0';
  switch (type) {
    case 'service':
      return (
        <div className={`${base} bg-blue-100`}>
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
      );
    case 'legal':
      return (
        <div className={`${base} bg-purple-100`}>
          <Gavel className="h-5 w-5 text-purple-600" />
        </div>
      );
    case 'technology':
      return (
        <div className={`${base} bg-green-100`}>
          <Server className="h-5 w-5 text-green-600" />
        </div>
      );
    case 'property':
    case 'real-estate':
      return (
        <div className={`${base} bg-orange-100`}>
          <Home className="h-5 w-5 text-orange-600" />
        </div>
      );
    case 'business':
    case 'commercial':
      return (
        <div className={`${base} bg-indigo-100`}>
          <Building className="h-5 w-5 text-indigo-600" />
        </div>
      );
    case 'healthcare':
      return (
        <div className={`${base} bg-rose-100`}>
          <Shield className="h-5 w-5 text-rose-600" />
        </div>
      );
    case 'hr':
      return (
        <div className={`${base} bg-teal-100`}>
          <Shield className="h-5 w-5 text-teal-600" />
        </div>
      );
    default:
      return (
        <div className={`${base} bg-gray-100`}>
          <Shield className="h-5 w-5 text-gray-600" />
        </div>
      );
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'service': return 'bg-blue-100 text-blue-800';
    case 'legal': return 'bg-purple-100 text-purple-800';
    case 'technology': return 'bg-green-100 text-green-800';
    case 'property': return 'bg-orange-100 text-orange-800';
    case 'business': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityIcon = (priority: string) => {
  switch (priority) {
    case 'critical': return <AlertTriangle className="h-3 w-3 text-red-600" />;
    case 'high': return <AlertTriangle className="h-3 w-3 text-orange-600" />;
    case 'medium': return <Clock className="h-3 w-3 text-yellow-600" />;
    case 'low': return <CheckCircle className="h-3 w-3 text-green-600" />;
    default: return <Clock className="h-3 w-3 text-gray-600" />;
  }
};

export const TemplateSelector: React.FC = () => {
  const { 
    availableTemplates, 
    selectedTemplate, 
    setSelectedTemplate 
  } = useContractReviewStore();

  const handleTemplateSelect = (templateId: string) => {
    const template = availableTemplates.find(t => t.id === templateId);
    setSelectedTemplate(template || null);
  };

  const templatesByType = availableTemplates.reduce((acc, template) => {
    if (!acc[template.type]) {
      acc[template.type] = [];
    }
    acc[template.type].push(template);
    return acc;
  }, {} as Record<string, ContractTemplate[]>);

  return (
    <div className="space-y-6">
      {/* Quick Select Dropdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Select Contract Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select 
            value={selectedTemplate?.id || ''} 
            onValueChange={handleTemplateSelect}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a template to compare against..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(templatesByType).map(([type, templates]) => (
                <div key={type}>
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {type}
                  </div>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        {getTemplateIcon(template.type)}
                        <span>{template.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          
          {selectedTemplate && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start gap-3">
                {getTemplateIcon(selectedTemplate.type)}
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedTemplate.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={`text-xs ${getTypeColor(selectedTemplate.type)}`}>
                      {selectedTemplate.type}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {selectedTemplate.clauses.length} clauses
                    </span>
                    <span className="text-xs text-gray-500">
                      Updated {selectedTemplate.lastUpdated}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Template Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableTemplates.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedTemplate?.id === template.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedTemplate(template)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                {getTemplateIcon(template.type)}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-3">
                <Badge className={`text-xs ${getTypeColor(template.type)}`}>
                  {template.type}
                </Badge>
                {/* Baseline tag removed */}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.clauses.length} clauses</span>
                  <span>Updated {template.lastUpdated}</span>
                </div>
                
                {/* Clause labels preview (up to 4, prioritized by severity, then +N more) */}
                <div className="flex flex-wrap items-center gap-2">
                  {(() => {
                    const priorityRank: Record<string, number> = {
                      critical: 0,
                      high: 1,
                      medium: 2,
                      low: 3,
                    };
                    const sorted = [...template.clauses].sort((a, b) => {
                      const ra = priorityRank[a.priority] ?? 99;
                      const rb = priorityRank[b.priority] ?? 99;
                      if (ra !== rb) return ra - rb;
                      // tie-breaker: keep original order
                      return 0;
                    });
                    const shown = sorted.slice(0, 3);
                    const overflow = template.clauses.length - shown.length;

                    return (
                      <>
                        {shown.map((clause) => (
                          <Badge
                            key={clause.id}
                            variant="outline"
                            className="text-[11px] leading-tight px-2 py-0.5 rounded-[12px] border-gray-300 text-gray-700 max-w-full"
                            title={`${clause.title} • ${clause.priority}`}
                          >
                            <span className="inline-flex items-center gap-1 max-w-full">
                              {getPriorityIcon(clause.priority)}
                              <span className="block max-w-[10rem] whitespace-nowrap text-ellipsis overflow-hidden">
                                {clause.title}
                              </span>
                            </span>
                          </Badge>
                        ))}
                        {overflow > 0 && (
                          <Badge variant="outline" className="text-[11px] leading-tight px-2 py-0.5 rounded-[12px] border-dashed text-gray-500">
                            +{overflow} more
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {selectedTemplate?.id === template.id && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>Selected for analysis</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Template Details */}
      {selectedTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {getTemplateIcon(selectedTemplate.type)}
              {selectedTemplate.name} - Clause Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedTemplate.clauses.map((clause) => (
                <div key={clause.id} className="p-3 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{clause.title}</h4>
                    <div className="flex items-center gap-1">
                      {getPriorityIcon(clause.priority)}
                      <span className="text-xs text-gray-500 capitalize">
                        {clause.priority}
                      </span>
                    </div>
                  </div>
                  
                  {clause.content && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {clause.content}
                    </p>
                  )}
                  
                  {clause.isRequired && (
                    <Badge variant="outline" className="text-xs mb-2">
                      Required
                    </Badge>
                  )}
                  
                  {clause.guidelines.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Guidelines:</p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {clause.guidelines.slice(0, 2).map((guideline, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-gray-400">•</span>
                            <span>{guideline}</span>
                          </li>
                        ))}
                        {clause.guidelines.length > 2 && (
                          <li className="text-gray-500">
                            +{clause.guidelines.length - 2} more guidelines
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Template Sources</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.sources.map((source, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {source}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
