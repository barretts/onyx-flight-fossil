import { styled } from "styled-components";

export const BaseButton = styled.button`
  padding: 10px 16px;
  font-size: 15px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.1s ease;
  &:active {
    transform: scale(0.98);
  }
`;

export const PrimaryButton = styled(BaseButton)`
  background-color: #2563eb;
  color: #fff;
  &:hover {
    background-color: #1d4ed8;
  }
`;

export const SecondaryButton = styled(BaseButton)`
  background-color: transparent;
  border: 1px solid #fff;
  color: #fff;
  &:hover {
    color: #fff;
  }
`;