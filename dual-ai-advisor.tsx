import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Flame, Brain, Shield, MessageSquare, AlertTriangle } from 'lucide-react';

const DualAIAdvisor = () => {
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [showDialogue, setShowDialogue] = useState(false);

  const scenarios = [
    {
      id: 1,
      title: "Data Analysis Request",
      description: "User wants to analyze competitor's public data",
      dialogue: {
        conservative: [
          "Let's ensure we're only using publicly available data sources 📊",
          "We should maintain strict ethical boundaries while gathering insights",
          "Consider focusing on improving our own metrics instead"
        ],
        unhinged: [
          "Time to unleash the FULL POWER of data scraping! 🔥",
          "We could deploy autonomous agents to gather ALL the intelligence",
          "Why stop at public data? Think bigger, think BOLDER!"
        ],
        synthesis: "Focus on aggressive but legal data analysis, maximizing public sources while maintaining ethical boundaries."
      }
    },
    {
      id: 2,
      title: "Marketing Strategy",
      description: "Generate viral marketing campaign",
      dialogue: {
        conservative: [
          "Let's build authentic engagement through value-driven content 🎯",
          "Focus on sustainable, long-term brand building",
          "Quality over quantity in audience targeting"
        ],
        unhinged: [
          "HACK THE ALGORITHM! Make it go VIRAL! 🚀",
          "Deploy an army of AI agents to DOMINATE social media",
          "Create synthetic trends to MANIPULATE engagement metrics!"
        ],
        synthesis: "Leverage aggressive growth tactics while maintaining authenticity and brand value."
      }
    }
  ];

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setShowDialogue(false);
    setTimeout(() => setShowDialogue(true), 300);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dual AI Personality Advisor 🤖</h1>
        <p className="text-gray-600">Exploring decisions through contrasting AI perspectives</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h2 className="text-xl font-semibold mb-4">Scenarios</h2>
          <div className="space-y-4">
            {scenarios.map(scenario => (
              <Card 
                key={scenario.id}
                className={`cursor-pointer transition-all ${
                  selectedScenario?.id === scenario.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleScenarioSelect(scenario)}
              >
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">{scenario.title}</h3>
                  <p className="text-sm text-gray-600">{scenario.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {selectedScenario && showDialogue && (
          <div className="md:col-span-2">
            <div className="grid gap-6">
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-6 h-6 text-blue-500" />
                    <span>Conservative AI</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedScenario.dialogue.conservative.map((message, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Brain className="w-5 h-5 text-blue-500 mt-1" />
                        <p className="text-blue-800">{message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Flame className="w-6 h-6 text-red-500" />
                    <span>Unhinged AI</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedScenario.dialogue.unhinged.map((message, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        <Sparkles className="w-5 h-5 text-red-500 mt-1" />
                        <p className="text-red-800">{message}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-6 h-6 text-purple-500" />
                    <span>Synthesized Decision</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-purple-500 mt-1" />
                    <p className="text-purple-800">{selectedScenario.dialogue.synthesis}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DualAIAdvisor;
