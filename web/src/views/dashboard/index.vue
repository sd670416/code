<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getApiHealth, getCamundaHealth } from '@/api/health';

/** 主平台 API 健康状态，初始值用于展示检查中。 */
const apiStatus = ref('checking');
/** Camunda 外置服务健康状态，初始值用于展示检查中。 */
const camundaStatus = ref('checking');

/**
 * 页面挂载后并行检查主平台和 Camunda 服务，任意一方失败都单独标记 DOWN。
 */
onMounted(async () => {
  const [api, camunda] = await Promise.allSettled([getApiHealth(), getCamundaHealth()]);
  apiStatus.value = api.status === 'fulfilled' ? api.value.status : 'DOWN';
  camundaStatus.value = camunda.status === 'fulfilled' ? camunda.value.status : 'DOWN';
});
</script>

<template>
  <NSpace vertical size="large">
    <NCard title="阶段 0 初始化状态" :bordered="false">
      <NGrid :cols="3" :x-gap="16">
        <NGi>
          <NStatistic label="主平台 API" :value="apiStatus" />
        </NGi>
        <NGi>
          <NStatistic label="Camunda 服务" :value="camundaStatus" />
        </NGi>
        <NGi>
          <NStatistic label="前端入口" value="UP" />
        </NGi>
      </NGrid>
    </NCard>

    <NCard title="开发边界" :bordered="false">
      <NList>
        <NListItem>统一前端入口：code/web</NListItem>
        <NListItem>主平台后端：code/api</NListItem>
        <NListItem>Camunda 外置服务：code/camunda</NListItem>
        <NListItem>流程设计器页面：code/web</NListItem>
      </NList>
    </NCard>
  </NSpace>
</template>
