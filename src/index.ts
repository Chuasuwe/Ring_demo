import {
    ViewerApp,
    AssetManagerPlugin,
    GBufferPlugin,
    ProgressivePlugin,
    TonemapPlugin,
    SSRPlugin,
    SSAOPlugin,
    BloomPlugin,
    Vector3,
    mobileAndTabletCheck,
    AssetImporter,
    Color,
    DiamondPlugin
} from "webgi";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

async function setupViewer() {
    // 初始化查看器
    const canvas = document.getElementById('webgi-canvas') as HTMLCanvasElement;
    const viewer = new ViewerApp({
        canvas,
        useGBufferDepth: true,
        isAntialiased: false
    });

    // 设置白色背景
    viewer.scene.background = new Color(1, 1, 1);

    // 检测是否为移动设备
    const isMobile = mobileAndTabletCheck();
    
    // 设置移动设备的显示缩放
    viewer.renderer.displayCanvasScaling = Math.min(window.devicePixelRatio, 1);

    // 添加必要的插件
    const manager = await viewer.addPlugin(AssetManagerPlugin);
    await viewer.addPlugin(GBufferPlugin);
    await viewer.addPlugin(new ProgressivePlugin(32));
    await viewer.addPlugin(new TonemapPlugin(true));
    const ssr = await viewer.addPlugin(SSRPlugin);
    const ssao = await viewer.addPlugin(SSAOPlugin);
    const bloom = await viewer.addPlugin(BloomPlugin);
    const diamond = await viewer.addPlugin(DiamondPlugin);

    // 移动端性能优化
    if (isMobile) {
        ssr!.passes.ssr.passObject.stepCount /= 2;
        bloom.enabled = false;
        viewer.renderer.refreshPipeline();
    }

    // 获取相机控制
    const camera = viewer.scene.activeCamera;
    const position = camera.position;
    const target = camera.target;
    let needsUpdate = true;

    // 加载进度处理
    const importer = manager.importer as AssetImporter;
    
    importer.addEventListener("onProgress", (ev) => {
        const progressRatio = ev.loaded / ev.total;
        document.querySelector('.progress')?.setAttribute('style', `transform: scaleX(${progressRatio})`);
    });

    importer.addEventListener("onLoad", () => {
        gsap.to('.loader', {
            x: '100%',
            duration: 0.8,
            ease: "power4.inOut",
            delay: 1,
            onComplete: () => {
                document.body.style.overflowY = "scroll";
            }
        });
    });

    // 加载3D模型
    await manager.addFromPath("./assets/ring_webgi.glb");

    // 设置所有宝石颜色为红色
    const diamondNames = [
        'diamonds',
        'diamonds001',
        'diamonds002',
        'diamonds003',
        'diamonds004',
        'diamonds005',
        'Object'  // 添加可能的其他命名
    ];

    // 方法1：通过名称查找
    diamondNames.forEach(name => {
        const diamonds = viewer.scene.findObjectsByName(name);
        if (diamonds.length > 0) {
            for (const diamond of diamonds) {
                diamond.material.color = new Color('#FF0000');
            }
        }
    });

    // 方法2：遍历所有对象
    viewer.scene.traverse((object) => {
        if (object.name && object.name.toLowerCase().includes('diamond')) {
            if (object.material) {
                object.material.color = new Color('#FF0000');
            }
        }
    });

    // 设置初始相机位置
    position.set(isMobile ? 3 : 3, isMobile ? -0.8 : -0.8, isMobile ? 1.2 : 1.2);
    target.set(isMobile ? 2.5 : 2.5, isMobile ? -0.07 : -0.07, isMobile ? -0.1 : -0.1);

    // 更新函数
    function onUpdate() {
        needsUpdate = true;
        viewer.setDirty();
    }

    // 设置滚动动画
    function setupScrollAnimation() {
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: ".sections-container",
                start: "top top",
                end: "bottom bottom",
                scrub: 1,
                immediateRender: false
            }
        });

        // 背景色设置 - 统一使用白色


        // 第一个视角到第二个视角的过渡
        tl.to(position, {
            x: -1.83,
            y: -0.14,
            z: 6.15,
            duration: 1,
            onUpdate
        }, 0)
        .to(target, {
            x: isMobile ? 0 : -0.78,
            y: isMobile ? 1.5 : -0.03,
            z: -0.12,
            duration: 1,
            onUpdate
        }, 0);

        // 第二个视角到第三个视角的过渡
        tl.to(position, {
            x: -0.06,
            y: -1.15,
            z: 4.42,
            duration: 1,
            onUpdate
        }, 1)
        .to(target, {
            x: -0.01,
            y: 0.9,
            z: 0.07,
            duration: 1,
            onUpdate
        }, 1);

        // 第三个视角到第四个视角的过渡（俯视角度）
        tl.to(position, {
            x: 0,
            y: 3.5,
            z: 0.5,
            duration: 1,
            onUpdate
        }, 2)
        .to(target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1,
            onUpdate
        }, 2);

        // 第四个视角到第五个视角的过渡（45度角）
        tl.to(position, {
            x: 2.5,
            y: 2.5,
            z: 2.5,
            duration: 1,
            onUpdate
        }, 3)
        .to(target, {
            x: 0,
            y: 0.5,
            z: 0,
            duration: 1,
            onUpdate
        }, 3);

        // 第五个视角到退场视角的过渡（戒指远去）
        tl.to(position, {
            x: 0,
            y: 0,
            z: 15,
            duration: 1.5,
            onUpdate
        }, 4)
        .to(target, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1.5,
            onUpdate
        }, 4)
        .to(position, {
            y: 5,
            duration: 0.5,
            onUpdate
        }, 4.5);

        // 内容动画
        gsap.to(".view-1 .content", {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: ".view-2",
                start: "top center",
                end: "top top",
                scrub: true
            }
        });

        gsap.fromTo(".view-2 .content",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                    trigger: ".view-2",
                    start: "top bottom",
                    end: "top center",
                    scrub: true
                }
            }
        );

        gsap.to(".view-2 .content", {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: ".view-3",
                start: "top center",
                end: "top top",
                scrub: true
            }
        });

        gsap.fromTo(".view-3 .content",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                    trigger: ".view-3",
                    start: "top bottom",
                    end: "top center",
                    scrub: true
                }
            }
        );

        gsap.to(".view-3 .content", {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: ".view-4",
                start: "top center",
                end: "top top",
                scrub: true
            }
        });

        gsap.fromTo(".view-4 .content",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                    trigger: ".view-4",
                    start: "top bottom",
                    end: "top center",
                    scrub: true
                }
            }
        );

        gsap.to(".view-4 .content", {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: ".view-5",
                start: "top center",
                end: "top top",
                scrub: true
            }
        });

        gsap.fromTo(".view-5 .content",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                    trigger: ".view-5",
                    start: "top bottom",
                    end: "top center",
                    scrub: true
                }
            }
        );

        // 最后一个视角的内容动画
        gsap.to(".view-5 .content", {
            opacity: 0,
            y: -50,
            scrollTrigger: {
                trigger: ".view-6",
                start: "top center",
                end: "top top",
                scrub: true
            }
        });

        gsap.fromTo(".view-6 .content",
            { opacity: 0, y: 50 },
            {
                opacity: 1,
                y: 0,
                scrollTrigger: {
                    trigger: ".view-6",
                    start: "top bottom",
                    end: "top center",
                    scrub: true
                }
            }
        );
    }

    // 每帧更新
    viewer.addEventListener('preFrame', () => {
        if (needsUpdate) {
            camera.positionUpdated(false);
            camera.targetUpdated(true);
            needsUpdate = false;
        }
    });

    // 初始化场景
    window.scrollTo(0, 0);
    viewer.renderer.refreshPipeline();

    // 设置白色背景
    viewer.setBackground(new Color('#FFFFFF').convertSRGBToLinear());
    
    setupScrollAnimation();
}

// 启动应用
setupViewer(); 