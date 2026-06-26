import { aiResponse } from "@/lib/ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from 'zod';

const BodySchema = z.object({
    ticket_id: z.string(),
    complaint: z.string().optional(),
    language: z.enum(['en', 'bn', 'mixed']).optional(),
    channel: z.enum(["in_app_chat", "call_center", "email", "merchant_portal",
        "field_agent"]).optional(),
    user_type: z.enum(["customer", "merchant", "agent", "unknown"]).optional(),
    campaign_context: z.string().optional(),
    metadata: z.object().optional(),
    transaction_history: z.array(
        z.object({
            transaction_id: z.string().optional(),
            timestamp: z.string().optional(),
            type: z.enum(["transfer", "payment", "cash_in", "cash_out", "settlement",
                "refund"]).optional(),
            amount: z.number().optional(),
            counterparty: z.string().optional(),
            status: z.enum(["completed", "failed", "pending", "reversed"])
        })
    ).optional()
})

const CaseTypeEnum = z.enum(['billing', 'account_access', 'technical_issue', 'fraud_report']);
const DepartmentEnum = z.enum(['billing_support', 'it_security', 'customer_success', 'legal']);

const ResponseSchema = z.object({
    ticket_id: z.string().min(1, "Ticket ID is required"),
    relevant_transaction_id: z.string().nullable(),
    evidence_verdict: z.enum(['consistent', 'inconsistent', 'insufficient_data']),
    case_type: CaseTypeEnum,
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    department: DepartmentEnum,
    agent_summary: z.string().min(1, "Agent summary is required"),
    recommended_next_action: z.string().min(1, "Recommended next action is required"),
    customer_reply: z.string().min(1, "Customer reply is required"),
    human_review_required: z.boolean(),
    confidence: z.number().min(0).max(1).optional(),
    reason_codes: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
    const payload = await req.json()
    const payloadRes = BodySchema.safeParse(payload)
    if (!payloadRes.success) {
        return NextResponse.json({
            error: true,
            message: "Invalid Payload",
        }, { status: 400 })
    }
    if (payloadRes.data.complaint?.trim() === '') {
        return NextResponse.json({
            error: true,
            message: "Complaint can't be empty!"
        }, { status: 422 })
    }
    const aiRes = await aiResponse(payloadRes.data)
    let validatedAiResponse = null;
    try {
        validatedAiResponse = JSON.parse(aiRes)
        const parseRes = ResponseSchema.safeParse(validatedAiResponse)
        if (!parseRes.success) {
            return NextResponse.json(parseRes.error, { status: 500 })
        }
    } catch {
        return NextResponse.json({
            error: true,
            message: "AN Unknown Server Side Error Occured"
        }, { status: 500 })
    }
    return NextResponse.json(validatedAiResponse, { status: 200 })
}