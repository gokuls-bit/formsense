import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { skillId, documentText } = await req.json();

        // This would traditionally run `npx skills run <skillId> --input <documentText>`
        // For SaaS responsiveness, we return mock transformation based on skillId mimicking MCP output.
        
        let transformedData = "";
        
        if (skillId === "summarize") {
            transformedData = "⚡ [AI Summary Executed] \nThe document revolves around significant financial entities requiring manual or automatic processing based on standard taxation schemas.";
        } else if (skillId === "extract-entities") {
            transformedData = JSON.stringify({
                "Organizations": ["FormSense Backend", "Stitch Labs"],
                "Dates mentioned": ["2026-03-22"],
                "Amounts": ["$1,500.25"]
            }, null, 2);
        } else if (skillId === "format-json") {
            transformedData = "{\n  \"status\": \"formatted cleanly\",\n  \"confidence\": 0.99\n}";
        } else {
            transformedData = "Operation completed with status: Unknown Skill.";
        }

        // Delay to mock AI inference
        await new Promise(r => setTimeout(r, 1200));

        return NextResponse.json({ success: true, transformedData });
    } catch (e) {
        return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
    }
}
