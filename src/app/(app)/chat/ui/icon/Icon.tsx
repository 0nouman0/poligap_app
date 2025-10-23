import type {FC} from 'react';

import { ICONS } from './constants'
import type {IconProps} from './types';
import { cn } from './../../utils/utils'

const Icon: FC<IconProps> = ({
  type,
  size = 'sm',
  className,
  color,
  disabled = false
}) => {
  const IconElement = ICONS[type]

  // Provider icons should use their natural colors, not text colors
  const isProviderIcon = ['openai_icon', 'groq_icon', 'claude_icon', 'portkey_icon', 'aws_icon', 'anthropic_icon', 'gemini_icon', 'meta_icon', 'deepseek_icon', 'gpt_icon'].includes(type);

  return (
    <IconElement
      className={cn(
        !isProviderIcon && (color && !disabled ? `text-${color}` : 'text-primary'),
        disabled && 'cursor-default opacity-50',
        className,
        size === 'xxs' && 'size-3',
        size === 'xs' && 'size-4',
        size === 'sm' && 'size-5',
        size === 'md' && 'size-[42px]',
        size === 'lg' && 'size-7',
        size === 'dot' && 'size-[5.07px]',
        size === 'default' && ' '
      )}
    />
  )
}

export default Icon
