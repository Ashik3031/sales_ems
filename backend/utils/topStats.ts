import { storage } from "../storage.js";
import type { Agent } from "@shared/schema";

export interface TopStats {
  topAgentMonth: {
    name: string;
    photoUrl: string;
    activations: number;
  };
  topAgentToday: {
    name: string;
    photoUrl: string;
    todaySubmissions: number;
  };
  totalActivations: number;
  totalSubmissions: number;
  totalTodaySubmissions: number; // 👈 NEW
}

export const computeTopStats = async (): Promise<TopStats> => {
  const allAgents = await storage.getAllAgents();



  if (!allAgents.length) {
    return {
      topAgentMonth: {
        name: "No agents",
        photoUrl: "",
        activations: 0,
      },
      topAgentToday: {
        name: "No agents",
        photoUrl: "",
        todaySubmissions: 0,
      },
      totalActivations: 0,
      totalSubmissions: 0,
      totalTodaySubmissions: 0,
    };
  }

  const topAgentMonth =
    allAgents.length > 0
      ? allAgents.reduce((top, agent) =>
        (agent.activations ?? 0) > (top.activations ?? 0) ? agent : top
      )
      : null;

  // 🔹 Top agent by TODAY submissions (todaySubmissions)
  const topAgentToday =
    allAgents.length > 0
      ? allAgents.reduce((top, agent) => {
        const topToday = (top as any).todaySubmissions ?? 0;
        const currentToday = (agent as any).todaySubmissions ?? 0;
        return currentToday > topToday ? agent : top;
      })
      : null;

  // 🔹 Monthly totals
  const totalActivations = allAgents.reduce(
    (sum, agent) => sum + (agent.activations ?? 0),
    0
  );
  const totalSubmissions = allAgents.reduce(
    (sum, agent) => sum + (agent.submissions ?? 0),
    0
  );

  // 🔹 Today's total submissions
  const totalTodaySubmissions = allAgents.reduce(
    (sum, agent) => sum + ((agent as any).todaySubmissions ?? 0),
    0
  );

  return {
    topAgentMonth: {
      name: topAgentMonth?.name ?? 'No agents',
      photoUrl: topAgentMonth?.photoUrl ?? '',
      activations: topAgentMonth?.activations ?? 0,
    },
    topAgentToday: {
      name: topAgentToday?.name ?? 'No agents',
      photoUrl: topAgentToday?.photoUrl ?? '',
      todaySubmissions: (topAgentToday as any)?.todaySubmissions ?? 0,
    },
    totalActivations,
    totalSubmissions,
    totalTodaySubmissions, // 👈 included in response
  };
};
