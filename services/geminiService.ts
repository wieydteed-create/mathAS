import { GoogleGenAI, Type } from "@google/genai";
import { FormulaExplanation } from '../types';

const explanationSchema = {
  type: Type.OBJECT,
  properties: {
    formulaName: {
      type: Type.STRING,
      description: "수학 공식의 이름 (예: 피타고라스의 정리). 공식이 틀렸거나 없을 경우 '알 수 없는 공식'이라고 명시.",
    },
    description: {
      type: Type.STRING,
      description: "해당 학년 학생이 이해하기 쉬운 공식에 대한 설명. 공식이 맞았을 경우에만 작성.",
    },
    example: {
      type: Type.STRING,
      description: "공식을 사용하는 간단하고 실제적인 예시. 공식이 맞았을 경우에만 작성.",
    },
    isCorrect: {
        type: Type.BOOLEAN,
        description: "입력된 공식이 수학적으로 올바른지 여부.",
    },
    correctionSuggestion: {
        type: Type.STRING,
        description: "공식이 틀렸거나 의미가 없을 경우, 수정 제안이나 친절한 안내 메시지. 공식이 맞았을 경우, 격려의 말을 작성.",
    }
  },
  required: ["formulaName", "description", "example", "isCorrect", "correctionSuggestion"],
};


export const explainFormula = async (grade: string, formula: string): Promise<FormulaExplanation> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const prompt = `
      당신은 한국의 ${grade} 학생을 위한 친절하고 유능한 수학 선생님입니다.
      학생이 다음 수학 공식을 입력했습니다: "${formula}"

      다음 작업들을 한국어로 수행해주세요:
      1. 이 공식이 수학적으로 타당한지 판단해주세요.
      2. 만약 공식이 맞다면, 공식의 이름, 설명, 그리고 ${grade} 학생의 눈높이에 맞는 간단한 사용 예시를 제공해주세요.
      3. 만약 공식이 틀렸거나 의미가 없다면, 부드럽게 지적하고 어떻게 수정하면 좋을지 제안하거나 다시 입력해달라고 요청해주세요.
      4. 최종 결과는 반드시 JSON 형식으로 제공해주세요.

      학생에게 항상 친절하고 격려하는 말투를 사용해주세요.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: explanationSchema,
      },
    });

    const jsonString = response.text;
    const parsedResponse = JSON.parse(jsonString);
    return parsedResponse as FormulaExplanation;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw error; // Re-throw the original error to be handled by the UI
    }
    throw new Error("AI와 통신하는 중 알 수 없는 오류가 발생했습니다.");
  }
};