<template lang="pug">
  ui-debio-card(block)
    .menstrual-calendar-banner
      .menstrual-calendar-banner__content
        .menstrual-calendar-banner__title Menstrual Calendar
        .menstrual-calendar-banner__sub-title Smart way to track your menstrual calendar.

      v-img(
        alt="no-list-data"
        src="@/assets/menstrual-calendar-banner.svg"
        max-width="373px"
        max-height="132px"
      )
</template>

<script>

export default {
  name: "MenstrualCalendarBanner"
}
</script>

<style lang="sass" scoped>
  @import "@/common/styles/mixins.sass"

  .menstrual-calendar-banner
    margin: -25px
    display: flex
    justify-content: space-between

    &__title
      margin: 32px 0px 8px 24px
      @include h5-opensans

    &__sub-title
      margin-left: 24px
      @include body-text-2

</style>
