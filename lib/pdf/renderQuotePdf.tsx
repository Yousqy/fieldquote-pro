import { renderToStream } from '@react-pdf/renderer'
import QuotePdfTemplate, { type QuotePdfTemplateProps } from './QuotePdfTemplate'

export async function renderQuotePdf(props: QuotePdfTemplateProps): Promise<Buffer> {
  const stream = await renderToStream(<QuotePdfTemplate {...props} />)

  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk as Uint8Array))
  }

  return Buffer.concat(chunks)
}
