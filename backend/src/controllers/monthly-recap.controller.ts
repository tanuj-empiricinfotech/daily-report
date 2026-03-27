/**
 * Monthly Recap Controller
 *
 * Handles HTTP requests for monthly recap functionality.
 */

import { Response, NextFunction } from 'express';
import { MonthlyRecapService } from '../services/monthly-recap.service';
import { AuthRequest } from '../middleware/auth';

const MIN_VALID_MONTH = 1;
const MAX_VALID_MONTH = 12;
const MIN_VALID_YEAR = 2020;
const MIN_SLIDE_INDEX = 0;
const MAX_SLIDE_INDEX = 7;

export class MonthlyRecapController {
  private service: MonthlyRecapService;

  constructor() {
    this.service = new MonthlyRecapService();
  }

  /**
   * Get or generate a monthly recap
   * GET /api/recaps/:year/:month
   */
  getRecap = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const year = parseInt(req.params.year, 10);
      const month = parseInt(req.params.month, 10);

      if (isNaN(month) || month < MIN_VALID_MONTH || month > MAX_VALID_MONTH) {
        res.status(400).json({
          success: false,
          error: 'Invalid month. Must be between 1 and 12.',
        });
        return;
      }

      if (isNaN(year) || year < MIN_VALID_YEAR) {
        res.status(400).json({
          success: false,
          error: `Invalid year. Must be ${MIN_VALID_YEAR} or later.`,
        });
        return;
      }

      const recap = await this.service.getOrGenerateRecap(req.user!.userId, month, year);

      res.json({
        success: true,
        data: recap,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update viewing progress for a recap
   * PATCH /api/recaps/:id/progress
   */
  updateProgress = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseInt(req.params.id, 10);
      const { slideIndex } = req.body;

      if (typeof slideIndex !== 'number' || slideIndex < MIN_SLIDE_INDEX || slideIndex > MAX_SLIDE_INDEX) {
        res.status(400).json({
          success: false,
          error: `Invalid slideIndex. Must be a number between ${MIN_SLIDE_INDEX} and ${MAX_SLIDE_INDEX}.`,
        });
        return;
      }

      await this.service.updateLastViewed(id, slideIndex);

      res.json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get available months that have recap data
   * GET /api/recaps/available
   */
  getAvailableMonths = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const months = await this.service.getAvailableMonths(req.user!.userId);

      res.json({
        success: true,
        data: months,
      });
    } catch (error) {
      next(error);
    }
  };
}
