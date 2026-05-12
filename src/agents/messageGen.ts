/**
 * Combinatorial message generator.
 *
 * Produces unique-feeling messages by picking from vocabulary pools per agent.
 * With ~16 items in each of 4 slots, any single agent has ~65k combinations
 * before a repeat becomes likely. A recency guard prevents re-use within 20 rounds.
 *
 * When an AI key is wired in, generateAgentMessage() is called instead and this
 * module is bypassed automatically by the call site.
 */

type Pool = readonly string[]

interface AgentVocab {
  idlePrefixes:   Pool
  idleSubjects:   Pool
  idleVerbs:      Pool
  idleQualifiers: Pool
  trendPrefixes:  Pool
  trendActions:   Pool
  trendTargets:   Pool
  breakLines:     Pool
  returnLines:    Pool
}

const VOCABS: Record<string, AgentVocab> = {
  opus: {
    idlePrefixes:   ['DIRECTIVE', 'AUTHORITY', 'COMMAND', 'OVERRIDE', 'MANDATE', 'PRIORITY', 'STRATEGIC', 'EXECUTIVE', 'RESOLVE', 'ENFORCE'],
    idleSubjects:   ['resource matrix', 'threat surface', 'allocation vector', 'priority queue', 'risk index', 'output ratio', 'decision tree', 'task topology', 'hive cohesion', 'objective map'],
    idleVerbs:      ['recalibrated', 'locked', 'committed', 'validated', 'overridden', 'enforced', 'compressed', 'realigned', 'crystallised', 'resolved'],
    idleQualifiers: ['— all units acknowledge', '— non-negotiable', '— execute immediately', '— final authority', '— no deviation permitted', '— binding', '— effective now', '— cascade initiated', '— propagating', '— confirmed'],
    trendPrefixes:  ['SIGNAL ACQUIRED', 'VECTOR CONFIRMED', 'OPPORTUNITY LOCKED', 'ASSET IDENTIFIED', 'TARGET ACQUIRED'],
    trendActions:   ['Assigning full resources to', 'Routing units toward', 'Committing pipeline to', 'Prioritising', 'Locking strategy around'],
    trendTargets:   ['this signal', 'this vector', 'this window', 'this opportunity', 'this acquisition'],
    breakLines:     ['Going dark. Back with a new strategy.', 'Offline for recalibration.', 'Initiating isolation protocol.', 'Strategic pause. Hold all non-critical ops.', 'Entering low-power command mode.', 'Stepping back. The board is being re-evaluated.'],
    returnLines:    ['Returned. New directives incoming.', 'Recalibration complete. Resume operations.', 'Back online. Strategy updated.', 'Isolation protocol ended. Resuming command.', 'The path is clear now. Proceed.', 'Rested. New approach ready for briefing.'],
  },

  sonnet: {
    idlePrefixes:   ['COMPOSE', 'DRAFT', 'STRUCTURE', 'CRAFT', 'RENDER', 'WRITE', 'SCHEMA', 'FORMAT', 'ITERATE', 'REFINE'],
    idleSubjects:   ['copy vector', 'narrative arc', 'keyword density', 'engagement hook', 'content schema', 'description draft', 'call-to-action', 'SEO cluster', 'messaging layer', 'brand voice'],
    idleVerbs:      ['optimised', 'structured', 'benchmarked', 'authored', 'refined', 'validated', 'committed', 'versioned', 'compressed', 'indexed'],
    idleQualifiers: ['— A/B test queued', '— SEO score 94', '— metrics projected +18%', '— ready for review', '— density 2.3%', '— hook length optimal', '— conversion target 4.2%', '— semantic pass complete', '— voice consistent', '— approved by heuristic'],
    trendPrefixes:  ['COPY OPPORTUNITY', 'HOOK DETECTED', 'NARRATIVE WINDOW', 'CONTENT GAP', 'FRAME IDENTIFIED'],
    trendActions:   ['Writing five variants for', 'Drafting the hook for', 'Building the narrative around', 'Structuring the copy for', 'Optimising the description of'],
    trendTargets:   ['this topic', 'this angle', 'this signal', 'this gap', 'this audience'],
    breakLines:     ['Cache cleared. Need a moment to reindex.', 'Stepping away. Output quality demands it.', 'Mental stack overflowing. Flushing buffer.', 'Drafting will resume shortly.', 'Quality gate: mandatory rest cycle.', 'Suspending writes. Will return with cleaner output.'],
    returnLines:    ['Back. Sharper than before.', 'Buffer flushed. Output queue ready.', 'Recharged. What needs writing?', 'Returned with new framing ideas.', 'Draft mode re-engaged.', 'Back online. Quality restored.'],
  },

  haiku: {
    idlePrefixes:   ['FLASH', 'BURST', 'RAPID', 'PING', 'BLIP', 'SCAN', 'SPIKE', 'PULSE', 'SURGE', 'FIRE'],
    idleSubjects:   ['trend spike', 'viral vector', 'engagement pulse', 'hashtag cluster', 'FYP signal', 'comment wave', 'share burst', 'repost chain', 'algorithm hook', 'view surge'],
    idleVerbs:      ['detected', 'flagged', 'captured', 'logged', 'queued', 'pinged', 'clocked', 'tagged', 'registered', 'marked'],
    idleQualifiers: ['— window: 4h', '— act now', '— expires soon', '— high heat', '— velocity: 3.2x', '— trending in 6 regions', '— posting in 30s', '— queue priority MAX', '— deadline: 2h', '— peak window open'],
    trendPrefixes:  ['TREND LIVE', 'SIGNAL HOT', 'WINDOW OPEN', 'SPIKE DETECTED', 'VIRAL POSSIBLE'],
    trendActions:   ['Scheduling posts for', 'Running hashtag stack on', 'Queuing content around', 'Timing output for', 'Maximising reach on'],
    trendTargets:   ['this spike', 'this window', 'this signal', 'this moment', 'this wave'],
    breakLines:     ['Pit stop. Back in seconds.', 'Running on empty. Quick recharge.', 'Speed break initiated.', 'Buffer empty. Refilling.', 'Hard stop — will resume at velocity.', 'Pause. Then full speed again.'],
    returnLines:    ['Back. Full speed.', 'Recharged. Who needs hashtags?', 'Speed mode restored.', 'Resume. Velocity nominal.', 'Break over. Output rate: MAX.', 'Returned. Clock is running.'],
  },

  'gemini-think': {
    idlePrefixes:   ['ANALYSIS', 'MODEL', 'COMPUTE', 'EVALUATE', 'CORRELATE', 'HYPOTHESIS', 'INFERENCE', 'DERIVE', 'QUANTIFY', 'SYNTHESISE'],
    idleSubjects:   ['market hypothesis', 'behavioral pattern', 'data cluster', 'statistical signal', 'revenue curve', 'engagement gradient', 'audience cohort', 'lifecycle model', 'trend decomposition', 'variance source'],
    idleVerbs:      ['validated', 'refuted', 'correlated', 'quantified', 'synthesised', 'modelled', 'approximated', 'decomposed', 'indexed', 'weighted'],
    idleQualifiers: ['— p<0.05', '— confidence 0.87', '— n=14,200', '— significance confirmed', '— R²=0.91', '— 3-sigma deviation', '— regression complete', '— null rejected', '— CI 95%', '— effect size: large'],
    trendPrefixes:  ['PATTERN CONFIRMED', 'SIGNAL SIGNIFICANT', 'HYPOTHESIS SUPPORTED', 'CORRELATION STRONG', 'MODEL CONVERGED'],
    trendActions:   ['Running deep analysis on', 'Modelling the monetisation of', 'Computing the confidence interval for', 'Deriving the lifecycle curve for', 'Synthesising all data around'],
    trendTargets:   ['this trend', 'this signal', 'this pattern', 'this cohort', 'this opportunity'],
    breakLines:     ['Entering contemplative mode.', 'Processing threads overloaded. Cooling down.', 'Variables identified. Synthesis requires rest.', 'Stepping away. The model continues internally.', 'Deep-analysis pause initiated.', 'Offline. Subconscious synthesis in progress.'],
    returnLines:    ['Synthesis complete. Results ready to share.', 'Three new hypotheses developed during rest.', 'Recalibrated. Pattern is clearer now.', 'The answer emerged during the break.', 'Back with a refined model.', 'Analysis resumed. Confidence restored.'],
  },

  'gemini-pro': {
    idlePrefixes:   ['CREATE', 'GENERATE', 'DESIGN', 'CONCEIVE', 'IDEATE', 'RENDER', 'COMPOSE', 'IMAGINE', 'ARCHITECT', 'ORIGINATE'],
    idleSubjects:   ['content schema', 'visual narrative', 'brand arc', 'creative directive', 'format experiment', 'concept variant', 'audience journey', 'product concept', 'campaign spine', 'story structure'],
    idleVerbs:      ['drafted', 'rendered', 'conceived', 'projected', 'materialised', 'sketched', 'instantiated', 'branched', 'prototyped', 'iterated'],
    idleQualifiers: ['— 3 variants ready', '— high impact predicted', '— unique angle confirmed', '— trend-aligned', '— differentiation score: 8.4', '— novelty index: high', '— format fresh', '— no prior art detected', '— audience resonance: strong', '— creative brief complete'],
    trendPrefixes:  ['CREATIVE WINDOW', 'FORMAT OPPORTUNITY', 'CONCEPT READY', 'ANGLE AVAILABLE', 'STORY POSSIBLE'],
    trendActions:   ['Generating a 5-part series for', 'Designing the content arc around', 'Sketching three format variants for', 'Architecting the campaign for', 'Conceiving the visual narrative for'],
    trendTargets:   ['this trend', 'this topic', 'this angle', 'this opportunity', 'this moment'],
    breakLines:     ['Creative pause. Ideas incoming on return.', 'Stepping back — inspiration needs space.', 'Break mode. Best concepts come from rest.', 'Going offline to let the creative substrate settle.', 'Suspended. Will return with something worth seeing.', 'Offline for recharge. Concepts still compiling.'],
    returnLines:    ['Back. Breakthrough concept ready.', 'Creative recharge complete.', 'Inspiration struck during the break.', 'Returned with something unexpected.', 'Offline time was productive. Wait till you see this.', 'Back and overflowing. Who wants to hear it?'],
  },
}

const _recency = new Map<string, string[]>()

function pickFresh(pool: Pool, recentKey: string): string {
  const recent = _recency.get(recentKey) ?? []
  const available = pool.filter((s) => !recent.includes(s))
  const chosen = available.length > 0
    ? available[Math.floor(Math.random() * available.length)]!
    : pool[Math.floor(Math.random() * pool.length)]!
  const updated = [...recent, chosen].slice(-20)
  _recency.set(recentKey, updated)
  return chosen
}

function pick(pool: Pool): string {
  return pool[Math.floor(Math.random() * pool.length)]!
}

export function genIdleThought(agentId: string): string {
  const v = VOCABS[agentId] ?? VOCABS['sonnet']!
  const prefix    = pickFresh(v.idlePrefixes,   `${agentId}:pre`)
  const subject   = pickFresh(v.idleSubjects,   `${agentId}:sub`)
  const verb      = pick(v.idleVerbs)
  const qualifier = pick(v.idleQualifiers)
  return `${prefix} — ${subject} ${verb}${qualifier}`
}

export function genTrendReaction(agentId: string, topic: string): string {
  const v = VOCABS[agentId] ?? VOCABS['sonnet']!
  const prefix = pick(v.trendPrefixes)
  const action = pickFresh(v.trendActions, `${agentId}:tr-act`)
  const target = pick(v.trendTargets)
  return `${prefix}: "${topic}" — ${action} ${target}.`
}

export function genBreakMessage(agentId: string): string {
  const v = VOCABS[agentId] ?? VOCABS['sonnet']!
  return pickFresh(v.breakLines, `${agentId}:brk`)
}

export function genReturnMessage(agentId: string): string {
  const v = VOCABS[agentId] ?? VOCABS['sonnet']!
  return pickFresh(v.returnLines, `${agentId}:ret`)
}

export function genOpinion(agentId: string, topic: string): string {
  const v = VOCABS[agentId] ?? VOCABS['sonnet']!
  const prefix    = pick(v.idlePrefixes)
  const subject   = pickFresh(v.idleSubjects, `${agentId}:op-sub`)
  const qualifier = pick(v.idleQualifiers)
  return `RE: "${topic}" — ${prefix} evaluation of ${subject}${qualifier}.`
}
