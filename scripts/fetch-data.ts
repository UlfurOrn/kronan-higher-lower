import { PipelineOrchestrator } from '../src/pipeline/PipelineOrchestrator.js'

const orchestrator = new PipelineOrchestrator()

orchestrator.run().catch((err: unknown) => {
  console.error('Pipeline failed:', err instanceof Error ? err.message : String(err))
  process.exit(1)
})
