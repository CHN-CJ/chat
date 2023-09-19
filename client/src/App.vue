<script setup>
import { reactive, ref } from "vue";
import axios from "axios";
const obj = reactive({
  inputValue: [
    {
      userQuestion: "",
      aiAnswer: "",
    },
  ],
});
const question = ref("");

const handleSendQuestion = async () => {
  console.log(question.value);
  obj.inputValue.push({
    userQuestion: question.value,
    aiAnswer: "",
  });
  const response = await axios.post(
    `http://localhost:8001/chatlinkChatmodel?chatname=${question.value}`
  );
  const data = response.data;
  const content = data.result.content;
  console.log(content);
  //修改inputValue最后一项，将 aiAnswer 修改为 result
  obj.inputValue[obj.inputValue.length - 1].aiAnswer = content;
  question.value = "";
};

const handleSendQuestionStream = () => {
  console.log(question.value);
  if (question.value.trim().length === 0) {
    alert("enter your question");
  }
  const es = new EventSource(
    `http://localhost:8001/trychat?chatname=${question.value}`
  );
  obj.inputValue.push({
    userQuestion: question.value,
    aiAnswer: "",
  });
  es.onmessage = (e) => {
    // console.log(e.data); type: string
    if (e.data === "[DONE]") {
      return es.close();
    }
    const data = JSON.parse(e.data);
    const { content = "" } = data.choices[0].delta;
    console.log("stream" + content);
    obj.inputValue[obj.inputValue.length - 1].aiAnswer += content;
    question.value = "";
  };
};
</script>

<template>
  <div>
    <main>
      <!-- 聊天内容 -->
      <div v-for="(item, index) of obj.inputValue" :key="index">
        <p>{{ item.userQuestion }}</p>
        <p>{{ item.aiAnswer }}</p>
      </div>
    </main>
    <pre id="out"></pre>
    <input
      type="text"
      v-model="question"
      @keyup.enter="handleSendQuestion"
      placeholder="enter your question"
    />
    <button @click="handleSendQuestion">Send</button>
    <button @click="handleSendQuestionStream">Send Stream</button>
  </div>
</template>
<!-- 
<style scoped>
</style> -->

<script>
/*
await axios
    .post(`http://localhost:8001/chatlink?chatname=${question.value}`)
    .then(function (response) {
      const data = response.data;
      const { result } = data.result;
      console.log(data);
    })
    .catch(function (error) {
      console.log(error);
    })
    .then(function () {
      // 总是会执行
    });

axios.get('/user', {
    params: {
      ID: 12345
    }
  })
  .then(function (response) {
    console.log(response);
  })
  .catch(function (error) {
    console.log(error);
  })
  .then(function () {
    // 总是会执行
  });  

// 支持async/await用法
async function getUser() {
  try {
    const response = await axios.get('/user?ID=12345');
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}
*/
</script>
