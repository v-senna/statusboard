import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
});
const app = express();

app.use(cors());
app.use(express.json());

// Get all units and their status
app.get('/api/units', async (req, res) => {
  try {
    const units = await prisma.unit.findMany({
      include: {
        _count: {
          select: { reports: true }
        }
      }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch units' });
  }
});

// Get details for a specific unit (reports history, etc)
app.get('/api/units/:id', async (req, res) => {
  const unitId = parseInt(req.params.id);
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        reports: {
          orderBy: { reportedAt: 'desc' },
          take: 50
        },
        incidents: {
          orderBy: { startedAt: 'desc' },
          take: 5
        }
      }
    });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });
    res.json(unit);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch unit details' });
  }
});

// Report a problem
app.post('/api/reports', async (req, res) => {
  const { unitId, problemType, userComment } = req.body;
  try {
    const report = await prisma.report.create({
      data: {
        unitId: parseInt(unitId),
        problemType,
        userComment
      }
    });

    // Basic Intelligence: check if we have > 5 reports in the last 15 mins for this unit
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const recentReports = await prisma.report.count({
      where: {
        unitId: parseInt(unitId),
        reportedAt: { gte: fifteenMinsAgo }
      }
    });

    if (recentReports >= 5) {
      await prisma.unit.update({
        where: { id: parseInt(unitId) },
        data: { currentStatus: 'CRITICAL' }
      });
    } else if (recentReports >= 2) {
      await prisma.unit.update({
        where: { id: parseInt(unitId) },
        data: { currentStatus: 'WARNING' }
      });
    }

    res.json({ success: true, report, recentReports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to report problem' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
