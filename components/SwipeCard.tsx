import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, Dimensions, Animated, PanResponder, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { colors, radii, shadows } from '@/theme/Theme';
import StampLabel from './StampLabel';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;

interface SwipeCardProps {
  uri: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeComplete?: () => void;
  aspectRatio?: number;
}

export default function SwipeCard({ uri, onSwipeLeft, onSwipeRight, onSwipeComplete, aspectRatio }: SwipeCardProps) {
  const position = useRef(new Animated.ValueXY()).current;
  const opacity = useRef(new Animated.Value(1)).current;
  
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const onSwipeCompleteRef = useRef(onSwipeComplete);
  
  useEffect(() => {
    onSwipeLeftRef.current = onSwipeLeft;
    onSwipeRightRef.current = onSwipeRight;
    onSwipeCompleteRef.current = onSwipeComplete;
  }, [onSwipeLeft, onSwipeRight, onSwipeComplete]);

  const keepOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const deleteOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const rotation = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-15deg', '0deg', '15deg'],
  });

  const resetPosition = useCallback(() => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start();
  }, [position]);

  const swipeOut = useCallback((direction: 'left' | 'right') => {
    const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.parallel([
      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: 250,
        useNativeDriver: false,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (direction === 'right') {
        onSwipeRightRef.current();
      } else {
        onSwipeLeftRef.current();
      }
      onSwipeCompleteRef.current?.();
      position.setValue({ x: 0, y: 0 });
      opacity.setValue(1);
    });
  }, [position, opacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.3 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeOut('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeOut('left');
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  return (
    <Animated.View
      style={[
        styles.container,
        shadows.card,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            { rotate: rotation },
          ],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.imageWrapper}>
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          transition={200}
        />
      </View>
      
      <Animated.View style={[styles.stampContainer, styles.keepStamp, { opacity: keepOpacity }]}>
        <StampLabel type="keep" rotation={-15} />
      </Animated.View>
      
      <Animated.View style={[styles.stampContainer, styles.deleteStamp, { opacity: deleteOpacity }]}>
        <StampLabel type="delete" rotation={15} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radii.photoCard,
    overflow: 'hidden',
    backgroundColor: colors.black,
  },
  imageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stampContainer: {
    position: 'absolute',
    top: 40,
  },
  keepStamp: {
    left: 20,
  },
  deleteStamp: {
    right: 20,
  },
});
