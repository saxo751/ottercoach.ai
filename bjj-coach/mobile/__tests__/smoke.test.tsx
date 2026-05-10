import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { RetroWindow } from '../src/components/RetroWindow';
import { MessageBubble } from '../src/components/MessageBubble';

describe('smoke: core components render', () => {
  it('RetroWindow renders title and children', () => {
    const { getByText } = render(
      <RetroWindow title="test.window" scrollable={false}>
        <Text>hello</Text>
      </RetroWindow>,
    );
    expect(getByText('test.window')).toBeTruthy();
    expect(getByText('hello')).toBeTruthy();
  });

  it('MessageBubble renders user message', () => {
    const { getByText } = render(
      <MessageBubble
        message={{
          id: 1,
          role: 'user',
          content: 'hello coach',
          created_at: new Date().toISOString(),
        }}
      />,
    );
    expect(getByText('hello coach')).toBeTruthy();
  });

  it('MessageBubble renders system message', () => {
    const { getByText } = render(
      <MessageBubble
        message={{
          id: 2,
          role: 'system',
          content: 'session started',
          created_at: new Date().toISOString(),
        }}
      />,
    );
    expect(getByText('session started')).toBeTruthy();
  });
});
