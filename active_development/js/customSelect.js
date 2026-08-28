/* ================================ */
/*  CUSTOM SELECT                   */
/* ================================ */
/* Styled dropdown enhancement for every <select>. */

function enhanceSelect(select){
    if(select.dataset.enhanced) return;
    select.dataset.enhanced = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "custom-select-wrapper";
    select.parentNode.insertBefore(wrapper, select);
    wrapper.appendChild(select);
    select.classList.add("custom-select-native");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "custom-select-trigger";
    wrapper.appendChild(trigger);

    const panel = document.createElement("div");
    panel.className = "custom-select-panel";
    wrapper.appendChild(panel);

    function renderOptions(){
        panel.innerHTML = "";
        Array.from(select.options).forEach(opt=>{
            if(opt.disabled) return;
            const item = document.createElement("button");
            item.type = "button";
            item.className = "custom-select-option" + (opt.value === select.value ? " selected" : "");
            item.innerHTML = `<span>${opt.textContent}</span><span class="custom-select-radio"></span>`;
            item.addEventListener("click", ()=>{
                select.value = opt.value;
                select.dispatchEvent(new Event("change", { bubbles:true }));
                updateTrigger();
                closePanel();
            });
            panel.appendChild(item);
        });
    }

    function updateTrigger(){
        const selectedOpt = select.options[select.selectedIndex];
        const label = selectedOpt ? selectedOpt.textContent : "Select";
        trigger.innerHTML = `<span>${label}</span><i class='bx bx-chevron-down'></i>`;
        trigger.classList.toggle("placeholder", !selectedOpt || selectedOpt.disabled);
    }

    function openPanel(){
        document.querySelectorAll(".custom-select-panel.open").forEach(p=>{
            if(p !== panel) p.classList.remove("open");
        });
        renderOptions();
        panel.classList.add("open");
        trigger.classList.add("open");
    }

    function closePanel(){
        panel.classList.remove("open");
        trigger.classList.remove("open");
    }

    trigger.addEventListener("click", (e)=>{
        e.stopPropagation();
        panel.classList.contains("open") ? closePanel() : openPanel();
    });

    document.addEventListener("click", (e)=>{
        if(!wrapper.contains(e.target)) closePanel();
    });

    updateTrigger();
}

export function enhanceAllSelects(){
    document.querySelectorAll("select").forEach(enhanceSelect);
}

document.addEventListener("DOMContentLoaded", enhanceAllSelects);