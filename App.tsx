import React, { useState, useCallback, useEffect } from 'react';
import { GRADE_LEVELS } from './constants';
import { FormulaExplanation } from './types';
import { explainFormula } from './services/geminiService';
import ResultCard from './components/ResultCard';

declare global {
    // FIX: Defined the AIStudio interface and used it for window.aistudio to resolve a TypeScript error about subsequent property declarations needing the same type.
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

const App: React.FC = () => {
  const [grade, setGrade] = useState<string>(GRADE_LEVELS[9]); // 고1 default
  const [formula, setFormula] = useState<string>('');
  const [result, setResult] = useState<FormulaExplanation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isApiKeySet, setIsApiKeySet] = useState<boolean>(false);

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsApiKeySet(hasKey);
        return hasKey;
    }
    setIsApiKeySet(false);
    return false;
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  const handleSelectApiKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // Optimistically set to true. The next API call will validate it.
      setIsApiKeySet(true);
    } else {
        setError("API 키 관리 기능을 사용할 수 없는 환경입니다.");
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasKey = await checkApiKey();
    if (!hasKey) {
        setError("AI를 사용하려면 API 키가 필요합니다. 'API 키 관리' 버튼을 클릭해 키를 설정해주세요.");
        return;
    }

    if (!formula.trim() || !grade) {
      setError("학년을 선택하고, 수학 공식을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const explanation = await explainFormula(grade, formula);
      setResult(explanation);
    } catch (err) {
      let errorMessage = "알 수 없는 오류가 발생했습니다.";
      if (err instanceof Error) {
        // Check for specific error messages related to invalid API keys
        if (err.message.toLowerCase().includes('api key') || err.message.includes('400') || err.message.includes('not found')) {
            errorMessage = "API 키가 유효하지 않거나 잘못되었습니다. 'API 키 관리' 버튼으로 다시 설정해주세요.";
            setIsApiKeySet(false); // Reset the key status
        } else {
            errorMessage = "AI와 통신하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [grade, formula, checkApiKey]);
  
  const LoadingSpinner: React.FC = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        <p className="text-gray-600 dark:text-gray-300">AI 선생님이 공식을 분석하고 있어요...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        
        <header className="text-center mb-8 relative">
            <div className="absolute top-0 right-0">
                <button
                    onClick={handleSelectApiKey}
                    className="bg-white dark:bg-gray-700/80 backdrop-blur-sm text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors shadow-md border border-gray-200 dark:border-gray-600 flex items-center gap-2"
                    aria-label="API 키 관리"
                >
                    <i className="fas fa-key text-yellow-500"></i>
                    <span>API 키 관리</span>
                    <span 
                        className={`h-2.5 w-2.5 rounded-full transition-colors ${isApiKeySet ? 'bg-green-400' : 'bg-red-400 animate-pulse'}`} 
                        title={isApiKeySet ? 'API 키가 설정되었습니다.' : 'API 키가 필요합니다.'}>
                    </span>
                </button>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 py-2">
                AI 수학 공식 도우미
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
                어려운 수학 공식, AI 선생님에게 물어보세요!
            </p>
        </header>

        <main className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                    <label htmlFor="grade-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i className="fas fa-user-graduate mr-2"></i>학년 선택
                    </label>
                    <select
                        id="grade-select"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        disabled={isLoading}
                    >
                        {GRADE_LEVELS.map(level => (
                            <option key={level} value={level}>{level}</option>
                        ))}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="formula-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <i className="fas fa-square-root-alt mr-2"></i>공식 입력
                    </label>
                    <textarea
                        id="formula-input"
                        rows={3}
                        value={formula}
                        onChange={(e) => setFormula(e.target.value)}
                        placeholder="예: ax² + bx + c = 0"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
                        disabled={isLoading}
                    />
                </div>
            </div>
            
            <div className="mt-6">
                <button
                    type="submit"
                    className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors"
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            분석 중...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-paper-plane mr-2"></i>질문하기
                        </>
                    )}
                </button>
            </div>
             {!isApiKeySet && !isLoading && (
                <div className="mt-4 text-center text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    AI를 사용하려면 API 키가 필요합니다. 우측 상단의 'API 키 관리' 버튼을 클릭해주세요.
                </div>
            )}
          </form>
        </main>
        
        <div className="mt-8">
            {isLoading && <LoadingSpinner />}
            {error && (
                <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 px-4 py-3 rounded-lg relative" role="alert">
                    <strong className="font-bold">오류: </strong>
                    <span className="block sm:inline">{error}</span>
                </div>
            )}
            {result && <ResultCard result={result} />}
        </div>
        
        <footer className="text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
            <p>Powered by Google Gemini. 학생들의 수학 학습을 응원합니다.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
