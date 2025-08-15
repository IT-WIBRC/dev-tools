<template>
  <div>
    Number of click made on the button {{}}
    <button @click="() => count++">Increment</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
const count = ref(0);
</script>
