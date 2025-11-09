<template>
  <nav class="menu-bar">
    <div 
      v-for="menu in menus" 
      :key="menu.id" 
      class="menu-item"
      @mouseenter="showSubMenu(menu.id)"
      @mouseleave="hideSubMenu(menu.id)"
    >
      <button 
        @click="$emit('select', menu)" 
        :class="{active: menu.id === activeId}"
      >
        {{ menu.name }}
      </button>
      
      <div 
        v-if="menu.subMenus && menu.subMenus.length > 0" 
        class="sub-menu"
        :class="{ 'show': hoveredMenuId === menu.id }"
      >
        <button 
          v-for="subMenu in menu.subMenus" 
          :key="subMenu.id"
          @click="$emit('select', subMenu, menu)"
          :class="{active: subMenu.id === activeSubMenuId}"
          class="sub-menu-item"
        >
          {{ subMenu.name }}
        </button>
      </div>
    </div>

    <button @click="toggleDark()" class="theme-toggle-button" title="切换深浅模式">
      <span v-if="isDark">☀️</span>
      <span v-else>🌙</span>
    </button>
  </nav>
</template>

<script setup>
import { ref } from 'vue';
// *** 我新添加的 import ***
import { useDark, useToggle } from '@vueuse/core';

const props = defineProps({ 
  menus: Array, 
  activeId: Number,
  activeSubMenuId: Number 
});

const hoveredMenuId = ref(null);

// *** 我新添加的逻辑 ***
const isDark = useDark();
const toggleDark = useToggle(isDark);

function showSubMenu(menuId) {
  hoveredMenuId.value = menuId;
}

function hideSubMenu(menuId) {
  // 延迟隐藏，给用户时间移动到子菜单
  setTimeout(() => {
    if (hoveredMenuId.value === menuId) {
      hoveredMenuId.value = null;
    }
  }, 100);
}
</script>

<style scoped>
/* *** 我已将下面所有的硬编码颜色 (如 #fff, #399dff) 
  *** 替换为 CSS 变量 (如 var(--menu-text-color)) 
*/

.menu-bar {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 0 1rem;
  position: relative;
}

.menu-item {
  position: relative;
}

.menu-bar button {
  background: transparent;
  border: none;
  color: var(--menu-text-color); /* 替换 #fff */
  font-size: 16px;
  font-weight: 500;
  padding: 0.8rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-shadow: var(--menu-text-shadow); /* 替换 rgba(0,0,0,0.3) */
  box-shadow: none;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.menu-bar button::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 0;
  height: 2px;
  background: var(--menu-active-color); /* 替换 #399dff */
  transition: all 0.3s ease;
  transform: translateX(-50%);
}

.menu-bar button:hover {
  color: var(--menu-active-color); /* 替换 #399dff */
  transform: translateY(-1px);
}

.menu-bar button.active {
  color: var(--menu-active-color); /* 替换 #399dff */
}

.menu-bar button.active::before {
  width: 60%;
}

/* 二级菜单样式 */
.sub-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--submenu-bg); /* 替换 #5c595900 */
  backdrop-filter: blur(8px);
  border-radius: 6px;
  min-width: 120px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  z-index: 1000;
  box-shadow: var(--submenu-shadow); /* 替换 rgba(0,0,0,0.4) */
  border: 1px solid var(--submenu-border); /* 替换 rgba(255,255,255,0.15) */
  margin-top: -2px; 
}

.sub-menu.show {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(2px);
}

.sub-menu-item {
  display: block !important;
  width: 100% !important;
  text-align: center !important;
  padding: 0.4rem 1rem !important;
  border: none !important;
  background: transparent !important;
  color: var(--menu-text-color) !important; /* 替换 #fff */
  font-size: 14px !important;
  font-weight: 400 !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  border-radius: 0 !important;
  text-shadow: none !important;
  line-height: 1.5 !important;
}

.sub-menu-item:hover {
  background: var(--submenu-hover-bg) !important; /* 替换 rgba(57,157,255,0.25) */
  color: var(--menu-active-color) !important; /* 替换 #399dff */
  transform: none !important;
}

.sub-menu-item.active {
  background: var(--submenu-active-bg) !important; /* 替换 rgba(57,157,255,0.35) */
  color: var(--menu-active-color) !important; /* 替换 #399dff */
  font-weight: 500 !important;
}

.sub-menu-item::before {
  display: none;
}

/* *** 我为切换按钮新加的样式 *** */
.theme-toggle-button {
  background-color: var(--card-bg); /* 使用已有的变量 */
  border: 1px solid var(--card-border); /* 使用已有的变量 */
  color: var(--text-color); /* 使用已有的变量 */
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 1rem; /* 给它一点空间 */
  padding: 0; /* 移除默认 padding */
}
.theme-toggle-button:hover {
  background-color: var(--card-bg); /* 确保 hover 样式一致 */
  color: var(--text-color); /* 确保 hover 样式一致 */
  transform: none; /* 移除父级的 :hover 效果 */
}
.theme-toggle-button::before {
  display: none; /* 移除父级的 ::before 效果 */
}
/* *** 响应式布局调整 *** */
@media (max-width: 768px) {
  .menu-bar {
    gap: 0.2rem;
  }
  
  .menu-bar button {
    font-size: 14px;
    padding: .4rem .8rem;
  }
  
  .sub-menu {
    min-width: 100px;
  }
  
  .sub-menu-item {
    font-size: 8px !important;
    padding: 0.2rem 0.8rem !important;
  }

  .theme-toggle-button {
    width: 32px;
    height: 32px;
    font-size: 1rem;
    margin-left: 0.5rem;
  }
}
</style>
