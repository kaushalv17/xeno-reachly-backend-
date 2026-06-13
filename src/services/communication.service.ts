import { prisma } from "../config/db"

export const communicationService = {
async listByCampaign(campaignId: string) {
return prisma.communication.findMany({
where: { campaignId },
select: {
id: true, recipient: true, status: true, statusRank: true, attempts: true,
failureReason: true, sentAt: true, deliveredAt: true, readAt: true,
clickedAt: true, convertedAt: true, failedAt: true,
},
orderBy: { statusRank: "desc" },
})
},

async statusBreakdown(campaignId: string) {
const rows = await prisma.communication.groupBy({
by: ["status"],
where: { campaignId },
_count: { _all: true },
})
return rows.map((r) => ({ status: r.status, count: r._count._all }))
},
}
