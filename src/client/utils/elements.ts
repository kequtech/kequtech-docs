export type ParentElement = Element | Document | undefined;

export function getElementById<T extends HTMLElement = HTMLElement>(
    id: string,
    force: false,
): T | undefined;
export function getElementById<T extends HTMLElement = HTMLElement>(
    id: string,
    force?: true,
): T;
export function getElementById<T extends HTMLElement = HTMLElement>(
    elementId: string,
    force = true,
): T | undefined {
    const result = document.getElementById(elementId) ?? undefined;
    if (!result && force) throw new Error(`Element #${elementId} missing`);
    return result as T | undefined;
}

export function getElement<T extends Element = HTMLElement>(
    el: ParentElement,
    selectors: string,
    force: false,
): T | undefined;
export function getElement<T extends Element = HTMLElement>(
    el: ParentElement,
    selectors: string,
    force?: true,
): T;
export function getElement<T extends Element = HTMLElement>(
    el: ParentElement,
    selectors: string,
    force = true,
): T | undefined {
    const result = el?.querySelector<T>(selectors) ?? undefined;
    if (!result && force) throw new Error(`Element ${selectors} missing`);
    return result;
}

export function getRoleElement<T extends Element = HTMLElement>(
    el: ParentElement,
    role: string,
    force: false,
): T | undefined;
export function getRoleElement<T extends Element = HTMLElement>(
    el: ParentElement,
    role: string,
    force?: true,
): T;
export function getRoleElement<T extends Element = HTMLElement>(
    el: ParentElement,
    role: string,
    force = true,
): T | undefined {
    const selectors = `[data-role="${role}"]`;
    const result = el?.querySelector<T>(selectors) ?? undefined;
    if (!result && force) throw new Error(`Element ${selectors} missing`);
    return result;
}

export function getInputElement<T extends Element = HTMLInputElement>(
    el: ParentElement,
    role: string,
    value: string | undefined,
    force: false,
): T | undefined;
export function getInputElement<T extends Element = HTMLInputElement>(
    el: ParentElement,
    role: string,
    value?: string,
    force?: true,
): T;
export function getInputElement<T extends Element = HTMLInputElement>(
    el: ParentElement,
    role: string,
    value?: string,
    force = true,
): T | undefined {
    const selectors = `[name="${role}"]${value !== undefined ? `[value="${value}"]` : ''}`;
    const result = el?.querySelector<T>(selectors) ?? undefined;
    if (!result && force) throw new Error(`Element ${selectors} missing`);
    return result;
}

export function getElementAll<T extends Element = HTMLElement>(
    el: ParentElement,
    selectors: string,
): T[] {
    return Array.from(el?.querySelectorAll<T>(selectors) ?? []);
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    className?: string,
    textContent?: string,
): HTMLElementTagNameMap[K] {
    const element = document.createElement(tagName);
    if (className) element.classList.add(...className.split(' '));
    if (textContent) element.textContent = textContent;
    return element;
}

export function createElementNS<K extends keyof SVGElementTagNameMap>(
    tagName: K,
    className: string,
    attrs: Record<string, string> = {},
): SVGElementTagNameMap[K] {
    const element = document.createElementNS(
        'http://www.w3.org/2000/svg',
        tagName,
    );
    element.classList.add(...className.split(' '));
    for (const [key, value] of Object.entries(attrs)) {
        element.setAttribute(key, value);
    }
    return element;
}

export function showHiddenElements(container?: HTMLElement) {
    requestAnimationFrame(() => {
        getElementAll(container, '.opacity-0').forEach((el) => {
            el.classList.remove('opacity-0');
        });
    });
}

export function disableForm(
    parentEl: HTMLElement,
    wait: string,
    role?: string,
) {
    const buttonEl = getButtonEl(parentEl, role);
    if (buttonEl) {
        const dataset = buttonEl.dataset;
        dataset.buttonText = dataset.buttonText ?? buttonEl.textContent ?? '';
        buttonEl.textContent = `${wait}…`;
    }
    for (const button of getElementAll<HTMLButtonElement>(parentEl, 'button')) {
        button.disabled = true;
    }
    return () => {
        if (buttonEl) {
            buttonEl.textContent = buttonEl.dataset.buttonText ?? 'Submit';
        }
        for (const button of getElementAll<HTMLButtonElement>(
            parentEl,
            'button',
        )) {
            button.disabled = false;
        }
    };
}

function getButtonEl(parentEl: HTMLElement, role?: string) {
    const selectors = role
        ? `button[data-role="${role}"]`
        : 'button[type="submit"]';
    return getElement<HTMLButtonElement>(parentEl, selectors, false);
}

export function confirmHelper(parentEl: HTMLElement) {
    const primaryActionsEl = getElement(parentEl, '.primary-actions');
    const confirmActionsEl = getElement(parentEl, '.confirm-actions');
    const needsConfirmButtonEl = getRoleElement(
        primaryActionsEl,
        'needs-confirm',
    );
    const cancelConfirmButtonEl = getRoleElement(
        confirmActionsEl,
        'cancel-confirm',
    );

    function onNeedsConfirm(ev: MouseEvent) {
        ev.preventDefault();
        primaryActionsEl.classList.add('hidden');
        confirmActionsEl.classList.remove('hidden');
    }

    function onCancelConfirm(ev: MouseEvent) {
        ev.preventDefault();
        confirmActionsEl.classList.add('hidden');
        primaryActionsEl.classList.remove('hidden');
    }

    needsConfirmButtonEl.addEventListener('click', onNeedsConfirm);
    cancelConfirmButtonEl.addEventListener('click', onCancelConfirm);

    return () => {
        needsConfirmButtonEl.removeEventListener('click', onNeedsConfirm);
        cancelConfirmButtonEl.removeEventListener('click', onCancelConfirm);
    };
}

export function autosizeTextarea(
    textareaEl: HTMLTextAreaElement,
    ghostEl: HTMLTextAreaElement,
) {
    function autosize() {
        ghostEl.style.width = `${textareaEl.clientWidth}px`;
        ghostEl.value = textareaEl.value;
        textareaEl.style.height = `${ghostEl.scrollHeight}px`;
    }

    const ro = new ResizeObserver(autosize);
    ro.observe(textareaEl);
    textareaEl.addEventListener('input', autosize);
    autosize();

    return () => {
        ro.disconnect();
        textareaEl.removeEventListener('input', autosize);
    };
}

export function clickOutside(root: HTMLElement, onOutside: () => void) {
    function handler(ev: PointerEvent) {
        if (!(ev.target instanceof HTMLElement) || !root.contains(ev.target)) {
            onOutside();
            document.removeEventListener('pointerdown', handler, true);
        }
    }

    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
}
