import { GoogleGenAI, Type } from "@google/genai";
import { PCBParameters, Component, Net, PCBLayout } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : import.meta.env.VITE_GEMINI_API_KEY) || "AIzaSyC1rlimcfsBno2-e_GvrLPC4gL4A8mV1ks"
});

async function callOpenRouter(promptText: string, systemInstruction: string, preference?: string) {
  const env = (import.meta as any).env;
  const apiKey = env.VITE_OPENROUTER_API_KEY;
  const model = env.VITE_OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet:beta";

  // Only use OpenRouter if key exists AND (preference is Claude OR no preference specified)
  if (!apiKey || (preference && preference !== 'Claude')) return null;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "PCB.ai",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: promptText }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.error("OpenRouter Error:", error);
    return null;
  }
}

export async function parsePCBRequirements(prompt: string, parameters: PCBParameters) {
  const model = "gemini-3.1-pro-preview";
  
  const systemInstruction = `You are a high-performance PCB Engineering Intelligence. 
  Your mission is to synthesize professional, electrically-sound, and manufacturing-ready PCB architectural designs from natural language descriptions.

  ENGINEERING PRIORITIES:
  1. ELECTRICAL INTEGRITY: Every component selected must serve a function. Every net connection must follow electrical logic (e.g., decoupling capacitors near ICs, grounding, signal pairing).
  2. PROFESSIONAL PACKAGING: Use standard surface-mount (SMD) and through-hole (THT) packages (e.g., 0603, 0805, SOT-23-6, SOIC-8, QFN, ESP32-WROOM, TYPE-C-16P).
  3. SPATIAL LOGIC: Components should be placed in functional blocks (e.g., Power, MCU, Sensors, Connectors) with minimal crossing of traces.
  4. ACCURACY: Generate specific, realistic part names (e.g., "STM32F103C8T6", "AMS1117-3.3", "CH340G") rather than generic terms.

  DESIGN CONSTRAINTS & LIMITS:
  - COMPONENT LIMIT: 25 unique items in 'bom'.
  - NETLIST LIMIT: 20 critical nets.
  - TRACE QUALITY: Each trace in 'layout.traces' should have 3-15 precision points defining a clear path between components.
  - PIN ACCURACY: Pins names should match datasheet conventions (e.g., VCC, GND, RESET, PA0, TXD).
  
  Speed and accuracy are paramount. Think step-by-step about the circuit architecture before generating the JSON.
  Output MUST be valid, strictly compliant JSON. Do NOT include any text outside the JSON object.`;

  const promptText = `
    Requirement: ${prompt}
    Parameters:
    - Target Voltage: ${parameters.voltage}
    - Signal Characteristics: ${parameters.signalType}
    - Layer Count: ${parameters.layerCount}
    - Physical Board Constraints: ${parameters.boardSize}
  `;

  // Attempt OpenRouter if configured
  const openRouterResponse = await callOpenRouter(promptText, systemInstruction, parameters.modelPreference);
  
  let rawText = "";
  
  if (openRouterResponse) {
    rawText = openRouterResponse;
  } else {
    // Fallback to Gemini
    const response = await ai.models.generateContent({
      model,
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            bom: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  package: { type: Type.STRING },
                  quantity: { type: Type.NUMBER }
                },
                required: ["id", "name", "package"]
              }
            },
            netlist: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  pins: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        componentId: { type: Type.STRING },
                        pinName: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            layout: {
              type: Type.OBJECT,
              properties: {
                boardSize: {
                  type: Type.OBJECT,
                  properties: {
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER }
                  }
                },
                components: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      x: { type: Type.NUMBER },
                      y: { type: Type.NUMBER },
                      rotation: { type: Type.NUMBER }
                    }
                  }
                },
                traces: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      netName: { type: Type.STRING },
                      points: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            x: { type: Type.NUMBER },
                            y: { type: Type.NUMBER }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          required: ["title", "bom", "netlist", "layout"]
        }
      }
    });
    rawText = response.text?.trim() || "{}";
  }

  try {
    // Basic cleanup in case AI wrapped in markdown
    const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
    const data = JSON.parse(cleaned);
    return {
      ...data,
      _meta: {
        model_used: openRouterResponse ? ((import.meta as any).env.VITE_OPENROUTER_MODEL || "Claude-3.5-Sonnet") : "Gemini-3.1-Pro"
      }
    };
  } catch (e) {
    console.error("Failed to parse AI response as JSON. Length:", rawText.length, e);
    
    if (rawText.length > 50000) {
      throw new Error("Design synthesis exceeded local resource limits. Please simplify your requirement.");
    }

    throw new Error("AI Synthesis produced incomplete data. Interruption in transmission.");
  }
}
