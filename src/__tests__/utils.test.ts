import { fmtDate, fmtRp, projectStats, adsStats } from "../lib/utils";
import { Project } from "../types";

describe("Utils", () => {
  it("formats date correctly", () => {
    expect(fmtDate("2024-01-01")).toBe("1 Jan 2024");
  });

  it("formats rupiah correctly", () => {
    expect(fmtRp(1500000)).toBe("Rp1.500.000");
    expect(fmtRp("50000")).toBe("Rp50.000");
  });

  it("calculates project stats correctly", () => {
    const p: Project = {
      id: "1",
      name: "Test",
      stripe: 0,
      client: "",
      lists: [
        {
          id: "l1",
          name: "Todo",
          todos: [
            { id: "t1", text: "A", assignee: "", done: true, due: "" },
            { id: "t2", text: "B", assignee: "", done: false, due: "2000-01-01" }, // Overdue
          ],
        },
      ],
      threads: [],
      files: [],
      notes: [],
      logs: [],
      targets: {},
      ads: { nonAds: false, entries: [] },
    };

    const stats = projectStats(p);
    expect(stats.total).toBe(2);
    expect(stats.done).toBe(1);
    expect(stats.overdue).toBe(1);
    expect(stats.progress).toBe(50);
    expect(stats.status.label).toBe("Tertinggal");
  });
  
  it("calculates ads stats correctly", () => {
    const p: Project = {
      id: "2", name: "Ads", stripe: 0, client: "",
      lists: [], threads: [], files: [], notes: [], logs: [], targets: {},
      ads: {
        nonAds: false,
        entries: [
          { id: "a1", name: "C1", platform: "Meta", budget: 100, spend: 50, status: "Aktif", issue: "", result: "", updatedAt: Date.now(), by: "me" }
        ]
      }
    };
    
    const stats = adsStats(p);
    expect(stats.budget).toBe(100);
    expect(stats.spend).toBe(50);
    expect(stats.aktif).toBe(1);
    expect(stats.masalah).toBe(false);
  });
});
