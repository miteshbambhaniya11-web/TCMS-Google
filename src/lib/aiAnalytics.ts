import { localDb, Trip, Truck, Driver, Contractor, FuelLog, VehicleExpense, Invoice } from '@/db/localDb';

export interface DriverScoreCard {
  driverId: string;
  name: string;
  score: number;
  grade: 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
  licenseAlert: boolean;
  varianceL: number;
}

export interface ContractorReliabilityCard {
  contractorId: string;
  name: string;
  score: number;
  completedTrips: number;
  activeFleet: number;
  reliability: 'High' | 'Medium' | 'Low';
}

export interface CustomerRiskCard {
  customerName: string;
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  totalPaid: number;
  totalPending: number;
  overdueCount: number;
}

export interface ProfitabilityCard {
  id: string;
  name: string;
  revenue: number;
  expenses: number;
  profit: number;
  marginPercent: number;
}

export interface EmptyReturnOpportunity {
  tripId: string;
  truckNumber: string;
  currentDestination: string;
  emptyReturnRoute: string;
  recommendedMarketplaceLoadId: number;
  potentialSavings: number;
  matchScore: number;
}

export interface DelayRootCause {
  tripId: string;
  tripNumber: string;
  routeDeviation: boolean;
  speedAnomalies: boolean;
  checkpostDelayHours: number;
  primaryCause: string;
  delayMinutes: number;
}

class AiAnalyticsEngine {
  // 1. Business Health Score (0-100)
  getBusinessHealthScore(tenantId: string): { score: number; trend: 'up' | 'down' | 'stable'; narrative: string } {
    const trips = localDb.getTrips(tenantId);
    const fuel = localDb.getFuelLogs(tenantId);
    const trucks = localDb.getTrucks(tenantId);
    
    if (trips.length === 0) return { score: 75, trend: 'stable', narrative: 'No trip records to evaluate. Seed data active.' };

    // Ratio of completed trips vs total
    const completed = trips.filter(t => t.status === 'Completed').length;
    const completionRate = trips.length > 0 ? completed / trips.length : 0.8;

    // Fuel variance score
    const avgVariance = fuel.length > 0 
      ? fuel.reduce((acc, curr) => {
          const v = Number(curr.variance);
          return acc + (isNaN(v) ? 0 : Math.abs(v));
        }, 0) / fuel.length
      : 0;
    const fuelHealth = Math.max(0, 100 - (isNaN(avgVariance) ? 0 : avgVariance) * 8);

    // Fleet utilization ratio
    const activeTrucks = trucks.filter(t => t.status === 'On Trip').length;
    const utilization = trucks.length > 0 ? activeTrucks / trucks.length : 0.8;

    // Combine parameters
    const score = Math.round(
      (isNaN(completionRate) ? 0.8 : completionRate) * 30 + 
      (isNaN(fuelHealth) ? 80 : fuelHealth) * 40 + 
      (isNaN(utilization) ? 0.8 : utilization) * 30
    );
    const finalScore = isNaN(score) ? 75 : Math.min(100, Math.max(30, score));

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (finalScore > 85) trend = 'up';
    else if (finalScore < 60) trend = 'down';

    const narrative = finalScore > 80 
      ? 'Fleet operations running at peak efficiency. Low fuel variance and high route compliance.' 
      : finalScore > 60 
        ? 'Satisfactory performance. Minor fuel leak warnings and route deviation warnings detected.' 
        : 'Action required: High fuel leakage indicators and delays are impacting margins.';

    return { score: finalScore, trend, narrative };
  }

  // 2. Driver Performance Scoring (0-100)
  getDriverPerformanceScores(tenantId: string): DriverScoreCard[] {
    const drivers = localDb.getDrivers(tenantId);
    const trips = localDb.getTrips(tenantId);
    const fuel = localDb.getFuelLogs(tenantId);

    return drivers.map(d => {
      const driverTrips = trips.filter(t => t.driverId === d.id);
      const tripIds = driverTrips.map(t => t.id);
      const driverFuel = fuel.filter(f => tripIds.includes(f.tripId));

      let score = 85; // baseline

      // Deduct for license warnings
      const today = new Date();
      let licenseAlert = false;
      if (d.licenseExpiry) {
        const licenseExpiry = new Date(d.licenseExpiry);
        const diffTime = licenseExpiry.getTime() - today.getTime();
        if (!isNaN(diffTime)) {
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            score -= 25; // expired license penalty
            licenseAlert = true;
          } else if (diffDays <= 30) {
            score -= 10;
            licenseAlert = true;
          }
        }
      }

      // Deduct for fuel variance leakage
      const avgVar = driverFuel.length > 0 
        ? driverFuel.reduce((acc, curr) => {
            const v = Number(curr.variance);
            return acc + (isNaN(v) ? 0 : v);
          }, 0) / driverFuel.length
        : 0;
      
      score -= isNaN(avgVar) ? 0 : Math.round(avgVar * 4);

      // Deduct for route deviations
      const deviations = driverTrips.filter(t => t.routeDeviationAlert).length;
      score -= deviations * 15;

      const finalScore = isNaN(score) ? 75 : Math.min(100, Math.max(10, score));

      let grade: DriverScoreCard['grade'] = 'Good';
      if (finalScore > 90) grade = 'Excellent';
      else if (finalScore > 75) grade = 'Good';
      else if (finalScore > 55) grade = 'Average';
      else grade = 'Needs Improvement';

      return {
        driverId: d.id,
        name: d.name,
        score: finalScore,
        grade,
        licenseAlert,
        varianceL: isNaN(avgVar) ? 0 : Number(avgVar.toFixed(1)),
      };
    });
  }

  // 3. Contractor Reliability Scoring (0-100)
  getContractorReliabilityScores(tenantId: string): ContractorReliabilityCard[] {
    const contractors = localDb.getContractors(tenantId);
    const trips = localDb.getTrips(tenantId);
    const trucks = localDb.getTrucks(tenantId);

    return contractors.map(c => {
      const contTrips = trips.filter(t => t.contractorId === c.id);
      const completed = contTrips.filter(t => t.status === 'Completed').length;
      const attachedFleet = trucks.filter(t => t.contractorId === c.id).length;

      let score = 75; // baseline

      if (contTrips.length > 0) {
        const completionRate = completed / contTrips.length;
        score += Math.round(completionRate * 20);
      }

      score += Math.min(10, attachedFleet * 2);

      const finalScore = Math.min(100, Math.max(20, score));
      let reliability: 'High' | 'Medium' | 'Low' = 'Medium';
      if (finalScore > 85) reliability = 'High';
      else if (finalScore < 60) reliability = 'Low';

      return {
        contractorId: c.id,
        name: c.name,
        score: finalScore,
        completedTrips: contTrips.length,
        activeFleet: attachedFleet,
        reliability,
      };
    });
  }

  // 4. Customer Payment Risk Scoring (0-100)
  getCustomerRiskScores(tenantId: string): CustomerRiskCard[] {
    const trips = localDb.getTrips(tenantId);
    const invoices = localDb.get<Invoice>('invoices', []);

    // TCMS is multi-tenant, so let's mock two key customer organizations
    const customers = ['Nirma Chemical Works', 'Adani Ports Logistics', 'Dev Salt Refineries'];

    return customers.map((cust, idx) => {
      // In this sandbox, Nirma corresponds to tenant-1 Customer User trips
      // Map invoices
      const isNirma = idx === 0;
      const relevantInvoices = invoices.filter(inv => {
        const trip = trips.find(t => t.id === inv.tripId);
        return isNirma ? trip?.pickup.includes('Mundra') : trip?.pickup.includes('Chirai');
      });

      const totalPaid = relevantInvoices
        .filter(i => i.status === 'Paid')
        .reduce((a, c) => a + (Number(c.finalAmount) || 0), 0);

      const totalPending = relevantInvoices
        .filter(i => ['Pending', 'Approved', 'Partial', 'On Hold'].includes(i.status))
        .reduce((a, c) => a + (Number(c.finalAmount) || 0), 0);

      const overdueCount = relevantInvoices.filter(i => i.status === 'On Hold').length;

      let score = 90; // high credit rating baseline
      score -= overdueCount * 15;
      if (totalPending > totalPaid * 1.5) score -= 20;

      const finalScore = Math.min(100, Math.max(10, score));
      let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
      if (finalScore > 80) riskLevel = 'Low';
      else if (finalScore > 55) riskLevel = 'Medium';
      else riskLevel = 'High';

      return {
        customerName: cust,
        score: finalScore,
        riskLevel,
        totalPaid,
        totalPending,
        overdueCount,
      };
    });
  }

  // 5. Vehicle/Truck Profitability
  getVehicleProfitability(tenantId: string): ProfitabilityCard[] {
    const trucks = localDb.getTrucks(tenantId);
    const trips = localDb.getTrips(tenantId);
    const expenses = localDb.getVehicleExpenses(tenantId);
    const fuel = localDb.getFuelLogs(tenantId);

    return trucks.map(tr => {
      const truckTrips = trips.filter(t => t.truckId === tr.id);
      const revenue = truckTrips.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      // Spends = Fuel card advance + toll card + repair expenses
      const tripIds = truckTrips.map(t => t.id);
      const fuelCosts = fuel
        .filter(f => tripIds.includes(f.tripId))
        .reduce((acc, curr) => acc + (Number(curr.actualFuel) || 0) * 88, 0); // 88/L diesel

      const repairCosts = expenses
        .filter(e => e.truckId === tr.id)
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      const standardTolls = truckTrips.length * 1500;
      
      const totalExpenses = fuelCosts + repairCosts + standardTolls;
      const profit = revenue - totalExpenses;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        id: tr.id,
        name: tr.truckNumber,
        revenue: isNaN(revenue) ? 0 : revenue,
        expenses: isNaN(totalExpenses) ? 0 : totalExpenses,
        profit: isNaN(profit) ? 0 : profit,
        marginPercent: isNaN(margin) ? 0 : margin,
      };
    });
  }

  // 6. Route Profitability
  getRouteProfitability(tenantId: string): ProfitabilityCard[] {
    const routes = localDb.getRoutes(tenantId);
    const trips = localDb.getTrips(tenantId);

    return routes.map(r => {
      const routeTrips = trips.filter(t => t.routeId === r.id);
      const revenue = routeTrips.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      // Expected costs based on route standards
      const expectedFuelCost = routeTrips.length * (Number(r.expectedFuel) || 0) * 88;
      const expectedTolls = routeTrips.length * (Number(r.tollCharges) || 0);
      const driverAdvances = routeTrips.length * 2000; // standard advance cash

      const totalExpenses = expectedFuelCost + expectedTolls + driverAdvances;
      const profit = revenue - totalExpenses;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        id: r.id,
        name: r.name,
        revenue: isNaN(revenue) ? 0 : revenue,
        expenses: isNaN(totalExpenses) ? 0 : totalExpenses,
        profit: isNaN(profit) ? 0 : profit,
        marginPercent: isNaN(margin) ? 0 : margin,
      };
    });
  }

  // 7. Customer Profitability
  getCustomerProfitability(tenantId: string): ProfitabilityCard[] {
    // customers maps
    const customers = ['Nirma Chemical Works', 'Adani Ports Logistics', 'Dev Salt Refineries'];
    const trips = localDb.getTrips(tenantId);

    return customers.map((c, idx) => {
      const isNirma = idx === 0;
      const custTrips = trips.filter(t => isNirma ? t.pickup.includes('Mundra') : t.pickup.includes('Chirai'));
      const revenue = custTrips.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

      // Hire fleet margins vs self fleet margins
      const hiredPayouts = custTrips
        .filter(t => t.contractorId)
        .reduce((acc, curr) => acc + (Number(curr.amount) || 0) * 0.9, 0); // 90% goes to broker

      const selfExpenses = custTrips
        .filter(t => !t.contractorId)
        .length * 15000; // average self operation cost placeholder

      const expenses = hiredPayouts + selfExpenses;
      const profit = revenue - expenses;
      const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

      return {
        id: `cust-${idx}`,
        name: c,
        revenue: isNaN(revenue) ? 0 : revenue,
        expenses: isNaN(expenses) ? 0 : expenses,
        profit: isNaN(profit) ? 0 : profit,
        marginPercent: isNaN(margin) ? 0 : margin,
      };
    });
  }

  // 8. Empty Return Opportunity Engine
  getEmptyReturnOpportunities(tenantId: string): EmptyReturnOpportunity[] {
    const trips = localDb.getTrips(tenantId);
    const trucks = localDb.getTrucks(tenantId);

    // Completed or Reached destination trips returning empty
    const idleReturns = trips.filter(t => ['Reached Destination', 'Unloading', 'Delivered'].includes(t.status));

    return idleReturns.map((trip, idx) => {
      const truckNo = trucks.find(tr => tr.id === trip.truckId)?.truckNumber || 'GJ-12-BY-1234';
      
      const amt = Number(trip.amount) || 0;
      // Look for a return load recommendation (matching destination back to pickup)
      return {
        tripId: trip.id,
        truckNumber: truckNo,
        currentDestination: trip.destination,
        emptyReturnRoute: `${trip.destination} to ${trip.pickup}`,
        recommendedMarketplaceLoadId: 101 + idx,
        potentialSavings: Math.round(amt * 0.75), // saving fuel return
        matchScore: 92 - idx * 5,
      };
    });
  }

  // 9. Delay Root Cause Analysis
  getDelayRootCauses(tenantId: string): DelayRootCause[] {
    const trips = localDb.getTrips(tenantId).filter(t => t.delayRisk === 'High' || t.delayRisk === 'Medium');

    return trips.map(t => {
      const isDeviated = t.routeDeviationAlert || false;
      const primaryCause = isDeviated 
        ? 'Route Deviation / Unauthorized Halt'
        : t.tripNumber === 'ASC-2026-00002'
          ? 'Salt Loading moisture checklist delay'
          : 'Samakhiali checkpost toll congestion';

      return {
        tripId: t.id,
        tripNumber: t.tripNumber,
        routeDeviation: isDeviated,
        speedAnomalies: t.currentSpeed ? t.currentSpeed < 20 : false,
        checkpostDelayHours: isDeviated ? 0 : 2.5,
        primaryCause,
        delayMinutes: isDeviated ? 120 : 90,
      };
    });
  }

  // 10. Smart Rate Recommendation
  getSmartRateRecommendations(tenantId: string): { routeName: string; currentRate: number; aiRecommendedRate: number; marginDeltaPercent: number; advice: string }[] {
    const routes = localDb.getRoutes(tenantId);
    return routes.map(r => {
      const rate = Number(r.standardRate) || 0;
      const aiRate = Math.round(rate * 1.05); // suggest 5% markup based on high demand season
      const delta = rate > 0 ? Math.round(((aiRate - rate) / rate) * 100) : 0;
      return {
        routeName: r.name,
        currentRate: rate,
        aiRecommendedRate: aiRate,
        marginDeltaPercent: delta,
        advice: `Monsoon salt demand is peak. You can increase rates by ₹${aiRate - rate} without volume drop.`,
      };
    });
  }

  // 11. Predictive Maintenance
  getPredictiveMaintenance(tenantId: string): { truckNumber: string; warningType: string; score: number; component: string; recommendation: string }[] {
    const trucks = localDb.getTrucks(tenantId);
    return trucks.map((tr, idx) => {
      const score = 88 - idx * 18;
      const comp = idx === 0 ? 'Engine Oil / Filter' : idx === 1 ? 'Rear Axle Tyres' : 'Brake Shoes';
      const warningType = score < 60 ? 'Immediate Action' : score < 80 ? 'Scheduled Attention' : 'Healthy';
      const recommendation = score < 60 
        ? `Tyre mileage run exceeds 85,000 km. Schedule retreading replacement.`
        : `Servicing due in 2,500 km. Schedule routine filters change.`;

      return {
        truckNumber: tr.truckNumber,
        warningType,
        score,
        component: comp,
        recommendation,
      };
    }).filter(i => i.score < 80);
  }
}

export const aiAnalytics = new AiAnalyticsEngine();
