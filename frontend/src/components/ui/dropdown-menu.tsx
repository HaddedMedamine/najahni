import * as Menu from '@radix-ui/react-dropdown-menu'
import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/core/lib/utils'

export const DropdownMenu = Menu.Root
export const DropdownMenuTrigger = Menu.Trigger

export function DropdownMenuContent({
  className,
  align = 'end',
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Content>) {
  return (
    <Menu.Portal>
      <Menu.Content
        align={align}
        sideOffset={6}
        className={cn(
          'z-50 min-w-48 rounded-2xl border border-border/70 bg-card p-1.5 shadow-xl shadow-primary/10',
          className,
        )}
        {...props}
      />
    </Menu.Portal>
  )
}

export function DropdownMenuItem({
  className,
  destructive,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-xl px-2.5 py-2 text-sm outline-none select-none data-[highlighted]:bg-primary-soft [&_svg]:size-4',
        destructive && 'text-danger',
        className,
      )}
      {...props}
    />
  )
}

export const DropdownMenuLabel = ({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Menu.Label>) => (
  <Menu.Label className={cn('px-2.5 py-2 text-sm', className)} {...props} />
)

export const DropdownMenuSeparator = () => (
  <Menu.Separator className="my-1 h-px bg-border" />
)
