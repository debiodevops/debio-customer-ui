<style scoped lang="scss">
.home-layout {
  width: 100vw;
  height: 100vh;
  background: #f5f7f9;
  background-image: url("../../assets/dna-background.png");
  background-repeat: no-repeat;
  background-size: cover;
  background-position: 150px 0px;

  display: grid;
  grid-template-rows: 120px calc(100vh - 120px);
  grid-auto-columns: 40% 60%;
  grid-template-areas:
    "header main"
    "welcome main";
}

.logo-card {
  width: 260px;
  height: 89px;

  background: white;
  box-shadow: 0px 2px 10px 0px #0000001a;
  border-radius: 0 16px 16px 0;

  margin-top: 29px;

  display: flex;
  justify-content: center;
  align-items: center;

  grid-area: header;

  img {
    width: 85%;
    height: 85%;
  }
}

.welcome {
  grid-area: welcome;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  div {
    h2 {
      width: 397px;
      height: 44px;
      font-family: "Roboto", sans-serif;
      font-style: normal;
      font-weight: bold;
      font-size: 35px;
      line-height: 41px;
      color: #363636;
      /* Remove existing margins */
      margin: 0;
      /* Re-add margins accordingly */
      margin-bottom: 27px;
    }

    h4 {
      width: 434px;
      height: 129px;
      font-family: "Raleway", sans-serif;
      font-style: normal;
      font-weight: 600;
      font-size: 20px;
      line-height: 150%;
      color: #363636;
      /* Remove existing margins */
      margin: 0;
    }

    span {
      font-family: "Raleway", sans-serif;
      font-style: normal;
      font-size: 20px;
      line-height: 150%;
      color: #363636;
      font-weight: 600;
    }
  }
}

.main {
  grid-area: main;

  display: flex;
  justify-content: center;
  align-items: center;
}
</style>

<template lang="pug">
.home-layout
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

  // Header
  .logo-card: img(src="@/assets/debio-words-logo.png")
  // Welcome Text
  .welcome
    div
      h2 Welcome to our site!
      h4 DeBio Network allows users to sample and test anonymously, without leaving home. Empower labs of all sizes to collaborate on analyzing genetic and medical data, and offering joint biomedical products.
      .text(style="margin-top:3rem; display:flex; flex-direction:row;") 
        span for further information visit 
        span(style="color:rgba(196, 0, 165, 1); cursor:pointer; margin-left:0.5rem" @click.prevent="redirectHome()") Debio.Network
  // Main

  // Main
  .main: router-view
</template>
<script>
export default {
  methods: {
    redirectHome() {
      window.open("https://www.debio.network/quickstart", "__blank");
    }
  }
};
</script>
