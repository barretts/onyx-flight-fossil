import { styled } from "styled-components";
import { PrimaryButton } from "./Buttons";

export const ChatContainer = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 1000;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
`;

export const ChatHeader = styled.header`
  background: #2563eb;
  color: #ffffff;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: bold;

  > span {
    flex: 1;
    padding-right: 8px;
  }

  > div {
    display: flex;
    flex-direction: column;
    span {
      font-weight: normal;
      font-size: 12px;
    }
    div {
      text-align: right;
      > button:first-child {
        margin-right: 8px;
      }
    }
  }
`;

export const ChatMessages = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background-color: #f6f8fa;
  font-size: 14px;
  color: #333;
`;

export const ChatInputContainer = styled.div`
  display: flex;
  border-top: 1px solid #e1e4e8;
`;

export const ChatTextarea = styled.textarea`
  flex: 1;
  padding: 12px;
  font-size: 14px;
  border: none;
  outline: none;
  resize: none;
  height: 60px;
  &:focus {
    background-color: #f0f4ff;
  }
`;

export const ChatSendButton = styled(PrimaryButton)`
  border-radius: 0;
  padding: 0 20px;
`;