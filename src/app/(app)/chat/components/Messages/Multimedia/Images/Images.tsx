import { memo } from 'react'

import type {ImageData} from './../../../../types/agent';
import { cn } from './../../../../utils/utils'
import DOMPurify from 'isomorphic-dompurify'

const Images = ({ images }: { images: ImageData[] }) => (
  <div
    className={cn(
      'grid max-w-xl gap-4',
      images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
    )}
  >
    {images.map((image) => (
      <div key={image.url} className="group relative">
        <img
          src={image.url}
          alt={image.revised_prompt || 'AI generated image'}
          className="w-full rounded-lg"
          onError={(e) => {
            const parent = e.currentTarget.parentElement
            if (parent) {
              const sanitizedUrl = DOMPurify.sanitize(image.url, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
              parent.innerHTML = DOMPurify.sanitize(`
                    <div class="flex h-40 flex-col items-center justify-center gap-2 rounded-md bg-secondary/50 text-muted" >
                      <p class="text-primary">Image unavailable</p>
                      <a href="${sanitizedUrl}" target="_blank" class="max-w-md truncate underline text-primary text-xs w-full text-center p-2">
                        ${sanitizedUrl}
                      </a>
                    </div>
                  `, {
                ALLOWED_TAGS: ['div', 'p', 'a'],
                ALLOWED_ATTR: ['class', 'href', 'target']
              });
            }
          }}
        />
      </div>
    ))}
  </div>
)

export default memo(Images)

Images.displayName = 'Images'
