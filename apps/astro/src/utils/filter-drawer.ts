// Below the desktop breakpoint the filters sit above the page, so the drawer behaves like a modal dialog
export function initFilterDrawer(listing: HTMLElement) {
  const opener = listing.querySelector<HTMLButtonElement>('.mobile-filter-button')!
  const sidebar = listing.querySelector<HTMLElement>('.filters')!
  const heading = listing.querySelector<HTMLElement>('.sidebar-header span')!
  const closeButton = listing.querySelector<HTMLButtonElement>('.close-sidebar')!
  const overlay = listing.querySelector<HTMLElement>('.overlay')!

  let inertElements: HTMLElement[] = []

  const isOpen = () => sidebar.getAttribute('aria-hidden') === 'false'

  // Everything beside the path from the page root to the drawer, apart from the overlay that closes it
  const getElementsOutsideDrawer = () => {
    const outside: HTMLElement[] = []

    for (let element: HTMLElement = sidebar; element.parentElement; element = element.parentElement) {
      const siblings = Array.from(element.parentElement.children).filter(
        (sibling) => sibling !== element && sibling !== overlay
      )
      outside.push(...(siblings as HTMLElement[]))
    }

    return outside
  }

  // The drawer turns visible during its transition, and a hidden element cannot take focus
  const focusCloseButton = () => {
    closeButton.focus()
    if (isOpen() && document.activeElement !== closeButton) requestAnimationFrame(focusCloseButton)
  }

  const open = () => {
    listing.setAttribute('data-mobile-open', 'true')
    opener.setAttribute('aria-expanded', 'true')
    sidebar.setAttribute('aria-hidden', 'false')
    sidebar.setAttribute('role', 'dialog')
    sidebar.setAttribute('aria-modal', 'true')
    sidebar.setAttribute('aria-label', heading.textContent ?? '')
    overlay.setAttribute('aria-hidden', 'false')

    inertElements = getElementsOutsideDrawer()
    inertElements.forEach((element) => (element.inert = true))

    focusCloseButton()
  }

  const close = () => {
    listing.setAttribute('data-mobile-open', 'false')
    opener.setAttribute('aria-expanded', 'false')
    // Not 'true': past the desktop breakpoint the same element is a visible sidebar
    sidebar.removeAttribute('aria-hidden')
    sidebar.removeAttribute('role')
    sidebar.removeAttribute('aria-modal')
    sidebar.removeAttribute('aria-label')
    overlay.setAttribute('aria-hidden', 'true')

    inertElements.forEach((element) => (element.inert = false))
    inertElements = []

    opener.focus()
  }

  opener.addEventListener('click', open)
  closeButton.addEventListener('click', close)
  overlay.addEventListener('click', close)

  // The address field uses Escape to close its suggestions first
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen() && !event.defaultPrevented) close()
  })

  // Only the width matters here: a mobile keyboard changes the height
  let currentWidth = window.innerWidth
  window.addEventListener('resize', () => {
    if (currentWidth === window.innerWidth) return

    currentWidth = window.innerWidth
    const isDesktop = currentWidth >= 1109 // 69.3125rem
    if (isDesktop && isOpen()) close()
  })
}
