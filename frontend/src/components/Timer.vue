<template>
    <span style="display:none;"></span>
</template>

<script lang="ts">
import Vue from 'vue';
import { getNextTickUnixtime } from '../misc/util';

export default Vue.extend({
    name: 'Timer',
    data() {
        return {
            timeoutInstance_update: null as any,
        };
    },
    created() {
        this.setTimeoutUpdate();
    },
    beforeDestroy() {
        clearTimeout(this.timeoutInstance_update);
    },
    methods: {
        setTimeoutUpdate() {
            clearTimeout(this.timeoutInstance_update);
            this.timeoutInstance_update = setTimeout(() => {
                this.$emit('tick');
                this.setTimeoutUpdate();
            }, getNextTickUnixtime());
        },
    },
});
</script>

