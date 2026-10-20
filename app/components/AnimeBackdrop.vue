<script setup lang="ts">
// 二次元装饰层：光斑 + 飘落花瓣 + 闪烁星尘（纯 CSS 动画，不影响交互）
const petals = [
  { left: '6%', size: 12, delay: 0, duration: 17, opacity: 0.5 },
  { left: '16%', size: 8, delay: 4, duration: 22, opacity: 0.4 },
  { left: '27%', size: 14, delay: 9, duration: 19, opacity: 0.55 },
  { left: '38%', size: 9, delay: 2, duration: 24, opacity: 0.35 },
  { left: '49%', size: 11, delay: 12, duration: 20, opacity: 0.45 },
  { left: '58%', size: 7, delay: 6, duration: 26, opacity: 0.4 },
  { left: '68%', size: 13, delay: 15, duration: 18, opacity: 0.5 },
  { left: '77%', size: 9, delay: 8, duration: 23, opacity: 0.38 },
  { left: '85%', size: 12, delay: 3, duration: 21, opacity: 0.45 },
  { left: '93%', size: 8, delay: 11, duration: 25, opacity: 0.35 },
];

const stars = [
  { top: '12%', left: '12%', delay: 0, size: 14 },
  { top: '22%', left: '88%', delay: 1.1, size: 18 },
  { top: '46%', left: '6%', delay: 2.2, size: 12 },
  { top: '64%', left: '94%', delay: 0.6, size: 15 },
  { top: '78%', left: '18%', delay: 1.7, size: 11 },
  { top: '8%', left: '62%', delay: 2.6, size: 13 },
];
</script>

<template>
  <div class="ac-deco" aria-hidden="true">
    <div class="ac-dots" />
    <div class="ac-blob" style="top: -12%; left: -8%; width: 42vw; height: 42vw; background: radial-gradient(circle, #ffc9e2 0%, rgba(255, 201, 226, 0) 70%)" />
    <div class="ac-blob" style="top: 8%; right: -10%; width: 38vw; height: 38vw; background: radial-gradient(circle, #c9e6ff 0%, rgba(201, 230, 255, 0) 70%); animation-delay: -5s" />
    <div class="ac-blob" style="bottom: -16%; left: 28%; width: 46vw; height: 46vw; background: radial-gradient(circle, #ddd0ff 0%, rgba(221, 208, 255, 0) 70%); animation-delay: -9s" />

    <span
      v-for="star in stars"
      :key="`star-${star.left}-${star.top}`"
      class="ac-star"
      :style="{ top: star.top, left: star.left, fontSize: `${star.size}px`, animationDelay: `${star.delay}s` }"
    >✧</span>

    <span
      v-for="petal in petals"
      :key="`petal-${petal.left}`"
      class="ac-petal"
      :style="{
        left: petal.left,
        width: `${petal.size}px`,
        height: `${petal.size}px`,
        opacity: petal.opacity,
        animationDelay: `${petal.delay}s`,
        animationDuration: `${petal.duration}s`,
      }"
    />
  </div>
</template>
