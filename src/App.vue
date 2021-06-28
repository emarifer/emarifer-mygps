<template>
  <v-app>
    <v-main>
      <MyMap />
    </v-main>
  </v-app>
</template>

<script>
  import MyMap from './components/MyMap';

  export default {
    name: 'App',

    components: {
      MyMap,
    },

    data: () => ({
      //
    }),
  };
</script>