/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import type { CommandModule } from 'yargs';

const WEEKS_PER_YEAR = 48;
const WEEKS_PER_QUARTER = 13;
const FOCUS_HOURS_PER_DEAL = 6;

export interface ProfitArgs {
  teamSize: number;
  hourlyRate: number;
  automationHours: number;
  conversionRate: number;
  offerValue: number;
  automationInvestment: number;
}

export interface ProfitPlan {
  weeklyTeamCapacity: number;
  annualHoursRedeployed: number;
  annualLaborValue: number;
  quarterlyOpportunitiesCreated: number;
  quarterlyDealsClosed: number;
  annualNewRevenue: number;
  paybackWeeks: number;
  roiMultiple: number;
  automationInvestment: number;
}

export function buildProfitPlan(args: ProfitArgs): ProfitPlan {
  const safeTeamSize = Math.max(args.teamSize, 0);
  const safeAutomationHours = Math.max(args.automationHours, 0);
  const safeHourlyRate = Math.max(args.hourlyRate, 0);
  const safeConversionRate = Math.min(Math.max(args.conversionRate, 0), 1);
  const safeOfferValue = Math.max(args.offerValue, 0);
  const safeAutomationInvestment = Math.max(args.automationInvestment, 0);

  const weeklyTeamCapacity = safeTeamSize * safeAutomationHours;
  const annualHoursRedeployed = weeklyTeamCapacity * WEEKS_PER_YEAR;
  const annualLaborValue = annualHoursRedeployed * safeHourlyRate;

  const quarterlyOpportunitiesCreated =
    weeklyTeamCapacity * WEEKS_PER_QUARTER * (1 / FOCUS_HOURS_PER_DEAL);
  const quarterlyDealsClosed =
    quarterlyOpportunitiesCreated * safeConversionRate;
  const annualNewRevenue = quarterlyDealsClosed * safeOfferValue * 4;

  const paybackWeeks =
    weeklyTeamCapacity * safeHourlyRate > 0
      ? safeAutomationInvestment / (weeklyTeamCapacity * safeHourlyRate)
      : Number.POSITIVE_INFINITY;

  const roiMultiple =
    safeAutomationInvestment > 0
      ? (annualLaborValue + annualNewRevenue) / safeAutomationInvestment
      : Number.POSITIVE_INFINITY;

  return {
    weeklyTeamCapacity,
    annualHoursRedeployed,
    annualLaborValue,
    quarterlyOpportunitiesCreated,
    quarterlyDealsClosed,
    annualNewRevenue,
    paybackWeeks,
    roiMultiple,
    automationInvestment: safeAutomationInvestment,
  };
}

function formatHours(value: number): string {
  return `${formatNumber(value)} hrs`;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value < 10 ? 1 : value < 100 ? 1 : 0,
  });
  return formatter.format(value);
}

function formatCurrency(value: number): string {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 1000 ? 0 : 0,
  });
  return formatter.format(value);
}

function formatPercentage(value: number): string {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 0,
  });
  return formatter.format(value);
}

function formatWeeks(value: number): string {
  if (!Number.isFinite(value)) {
    return 'n/a';
  }
  const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value < 10 ? 1 : 0,
  });
  return `${formatter.format(value)} weeks`;
}

interface HighLeverageProject {
  title: string;
  outcome: string;
  focus: string;
  steps: string[];
}

function buildHighLeverageProjects(plan: ProfitPlan): HighLeverageProject[] {
  const focusBlocks = Math.max(plan.weeklyTeamCapacity * 0.4, 4);

  return [
    {
      title: 'Systemize client intake + qualification',
      outcome: `Turn repetitive intake into assets and redirect ~${formatNumber(
        focusBlocks,
      )} hrs/week into high-value conversations.`,
      focus:
        'Capture everything clients repeat, compress it once with Gemini CLI, and serve it automatically inside your workflow.',
      steps: [
        'Run `gemini -p "Summarize the following discovery call" < call_transcript.txt` to generate reusable briefing notes.',
        'Store the best prompts as `/intake` commands so anyone on the team can produce the same outcome in seconds.',
        'Pipe those briefs into your CRM or proposal templates to eliminate the handoff lag between sales and delivery.',
      ],
    },
    {
      title: 'Automate follow-up + proposal production',
      outcome: `Convert the reclaimed ${formatHours(
        plan.weeklyTeamCapacity,
      )} into deals by removing proposal bottlenecks.`,
      focus:
        'Blend Gemini CLI with your template library so high-signal prospects receive polished follow-ups within the same hour.',
      steps: [
        'Create a `/proposal` slash command that ingests `@requirements.md` and outputs a scoped offer with options.',
        'Schedule `gemini --prompt "Draft a follow-up sequence"` in your automation runner to refresh nurture copy every month.',
        'Track send → response rates so the model can A/B test call-to-actions and keep the highest converting language.',
      ],
    },
    {
      title: 'Build a live leverage dashboard',
      outcome: `Instrument the ${formatCurrency(
        plan.annualLaborValue + plan.annualNewRevenue,
      )} upside so leadership keeps reinvesting.`,
      focus:
        'Make the gains visible: tie regained hours to invoices, track close rates, and share the compounding wins weekly.',
      steps: [
        'Use `gemini --prompt "Summarize this week\'s automation wins" < automation_log.md` for a Friday highlights digest.',
        'Feed time-tracking exports into the CLI to produce charts that show hours returned vs. revenue generated.',
        'Publish the dashboard in Notion or Slides automatically so every stakeholder sees the velocity increase.',
      ],
    },
  ];
}

function logHighLeverageProjects(projects: HighLeverageProject[]) {
  console.log('\n90-Day Execution Blueprint:');
  projects.forEach((project, index) => {
    console.log(`\n${index + 1}. ${project.title}`);
    console.log(`   Outcome: ${project.outcome}`);
    console.log(`   Focus: ${project.focus}`);
    project.steps.forEach((step) => {
      console.log(`   - ${step}`);
    });
  });
}

export const profitCommand: CommandModule<unknown, ProfitArgs> = {
  command: 'profit',
  describe:
    'Generate a Gemini-powered profitability plan tailored to your team inputs.',
  builder: (yargsInstance) =>
    yargsInstance
      .option('team-size', {
        type: 'number',
        describe: 'Number of people whose workload you want to amplify.',
        default: 1,
      })
      .option('hourly-rate', {
        type: 'number',
        describe:
          'Average blended hourly rate for those team members (in USD).',
        default: 120,
      })
      .option('automation-hours', {
        type: 'number',
        describe:
          'Estimated weekly hours per person you can hand to automation + Gemini.',
        default: 5,
      })
      .option('conversion-rate', {
        type: 'number',
        describe:
          'Close rate you expect on new opportunities created with the freed time (0-1).',
        default: 0.25,
      })
      .option('offer-value', {
        type: 'number',
        describe: 'Average revenue per deal closed (in USD).',
        default: 8000,
      })
      .option('automation-investment', {
        type: 'number',
        describe: 'Year-one investment you plan to make in automation + tooling.',
        default: 10000,
      })
      .check((argv) => {
        if (argv['conversion-rate'] !== undefined) {
          if (argv['conversion-rate'] < 0 || argv['conversion-rate'] > 1) {
            throw new Error('conversion-rate must be between 0 and 1.');
          }
        }
        return true;
      }),
  handler: (argv) => {
    const plan = buildProfitPlan({
      teamSize: argv['team-size'],
      hourlyRate: argv['hourly-rate'],
      automationHours: argv['automation-hours'],
      conversionRate: argv['conversion-rate'],
      offerValue: argv['offer-value'],
      automationInvestment: argv['automation-investment'],
    });

    console.log('\n🚀 Gemini Automation Profit Multiplier');
    console.log('=====================================');

    console.log('\nInputs:');
    console.log(`  • Team members amplified: ${formatNumber(argv['team-size'])}`);
    console.log(
      `  • Weekly automation hours per person: ${formatHours(
        argv['automation-hours'],
      )}`,
    );
    console.log(
      `  • Blended hourly rate: ${formatCurrency(argv['hourly-rate'])}/hour`,
    );
    console.log(
      `  • Conversion rate on new outreach: ${formatPercentage(
        argv['conversion-rate'],
      )}`,
    );
    console.log(
      `  • Average deal value: ${formatCurrency(argv['offer-value'])}`,
    );
    console.log(
      `  • Automation investment: ${formatCurrency(
        argv['automation-investment'],
      )}`,
    );

    console.log('\nImpact Summary:');
    console.log(
      `  • Weekly team hours returned: ${formatHours(
        plan.weeklyTeamCapacity,
      )}`,
    );
    console.log(
      `  • Annual labor capacity unlocked: ${formatHours(
        plan.annualHoursRedeployed,
      )}`,
    );
    console.log(
      `  • Annual labor value recaptured: ${formatCurrency(
        plan.annualLaborValue,
      )}`,
    );
    console.log(
      `  • Qualified opportunities per quarter: ${formatNumber(
        plan.quarterlyOpportunitiesCreated,
      )} (${formatNumber(plan.quarterlyDealsClosed)} wins @ ${formatPercentage(
        argv['conversion-rate'],
      )})`,
    );
    console.log(
      `  • Annual new revenue potential: ${formatCurrency(
        plan.annualNewRevenue,
      )}`,
    );
    console.log(
      `  • Payback period: ${formatWeeks(plan.paybackWeeks)} (${formatCurrency(
        plan.automationInvestment,
      )} → break even)`
    );
    console.log(
      `  • ROI multiple (year one): ${
        Number.isFinite(plan.roiMultiple)
          ? `${formatNumber(plan.roiMultiple)}x`
          : 'n/a'
      }`,
    );

    logHighLeverageProjects(buildHighLeverageProjects(plan));

    console.log('\nMomentum Metrics to Track:');
    console.log(
      `  • Weekly hours Gemini CLI hands back vs. baseline (${formatHours(
        plan.weeklyTeamCapacity,
      )}).`,
    );
    console.log(
      '  • Proposal turnaround time before/after automation (target: under 2 hours).',
    );
    console.log(
      `  • Pipeline lift: ${formatNumber(
        plan.quarterlyDealsClosed,
      )} additional wins/quarter × ${formatCurrency(argv['offer-value'])}.`,
    );
    console.log('  • Leading indicator: meetings booked per 10 personalized outreach attempts.');

    console.log('\n🎯 Next step: schedule a 45-minute build sprint, run the first project, and report the unlocked capacity to your team.\n');
  },
};
