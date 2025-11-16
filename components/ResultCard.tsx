
import React from 'react';
import { FormulaExplanation } from '../types';

interface ResultCardProps {
  result: FormulaExplanation;
}

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mt-6">
    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
      <i className={`fas ${icon} mr-3 text-indigo-500`}></i>
      {title}
    </h3>
    <div className="mt-2 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg prose prose-sm max-w-none">
        {children}
    </div>
  </div>
);

const ResultCard: React.FC<ResultCardProps> = ({ result }) => {
  if (!result.isCorrect) {
    return (
      <div className="animate-fade-in bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-yellow-300 dark:border-yellow-600">
        <h2 className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center">
            <i className="fas fa-exclamation-triangle mr-3"></i>
            {result.formulaName}
        </h2>
        <Section title="AI 선생님의 조언" icon="fa-comment-dots">
          <p>{result.correctionSuggestion}</p>
        </Section>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        {result.formulaName}
      </h2>
      <p className="mt-1 text-indigo-500 dark:text-indigo-400">{result.correctionSuggestion}</p>

      <Section title="이건 어떤 공식인가요?" icon="fa-book-open">
        <p>{result.description}</p>
      </Section>

      <Section title="어떻게 사용하나요? (예시)" icon="fa-lightbulb">
        <p className="whitespace-pre-wrap font-mono bg-gray-100 dark:bg-gray-900 p-3 rounded-md">{result.example}</p>
      </Section>
    </div>
  );
};

export default ResultCard;
